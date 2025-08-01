package connection

import (
	"errors"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nkeys"
	"sync"
)

type Conn interface {
	Close()
}

type Pool[T Conn] interface {
	Get(id string) (T, error)
	Refresh(id string) error
	Purge()
}

type ConnPool[T Conn] struct {
	m     sync.Mutex
	conns map[string]T
	repo  ConnRepo
	build func(connection *Connection) (T, error)
}

func NewConnPool[T Conn](repo ConnRepo, builder ConnBuilder[T]) *ConnPool[T] {
	return &ConnPool[T]{
		conns: make(map[string]T),
		repo:  repo,
		build: builder,
	}
}

func NewNatsConnPool(repo ConnRepo) *ConnPool[*NatsConn] {
	return NewConnPool[*NatsConn](repo, NatsBuilder)
}

func (p *ConnPool[T]) Get(id string) (T, error) {
	p.m.Lock()
	defer p.m.Unlock()
	if t, ok := p.conns[id]; !ok {
		err := p.refreshLocked(id)
		if err != nil {
			return t, err
		}
	}
	c, ok := p.conns[id]
	if ok {
		return c, nil
	}
	return c, errors.New("cannot find connection in pool")
}

func (p *ConnPool[T]) Refresh(id string) error {
	p.m.Lock()
	defer p.m.Unlock()
	return p.refreshLocked(id)
}

func (p *ConnPool[T]) Purge() {
	for k, c := range p.conns {
		if _, err := p.repo.GetById(k); err != nil {
			c.Close()
			delete(p.conns, k)
		}
	}
}

func (p *ConnPool[T]) refreshLocked(id string) error {
	c, err := p.repo.GetById(id)
	if err != nil {
		return err
	}
	if currentConn, ok := p.conns[id]; ok {
		currentConn.Close()
	}
	conn, err := p.build(c)
	if err != nil {
		return err
	}
	p.conns[id] = conn
	return nil
}

func appendTLSAuthOptions(connection *Connection, options []nats.Option) []nats.Option {
	if connection.TLSAuth.Enabled {
		if connection.TLSAuth.CertPath != "" && connection.TLSAuth.KeyPath != "" {
			options = append(options, nats.ClientCert(connection.TLSAuth.CertPath, connection.TLSAuth.KeyPath))
		}
		if connection.TLSAuth.CaPath != "" {
			options = append(options, nats.RootCAs(connection.TLSAuth.CaPath))
		}
	}
	if connection.TLSAuth.HandshakeFirst {
		options = append(options, nats.TLSHandshakeFirst())
	}
	return options
}

func appendInboxPrefixOption(connection *Connection, options []nats.Option) []nats.Option {
	if connection.InboxPrefix != "" {
		options = append(options, nats.CustomInboxPrefix(connection.InboxPrefix))
	}
	return options
}

func buildNkeyOption(activeAuth *Auth) nats.Option {
	nKeyOption := nats.Nkey(
		activeAuth.Username,
		func(b []byte) ([]byte, error) {
			sk, err := nkeys.FromSeed([]byte(activeAuth.NKeySeed))
			if err != nil {
				return nil, err
			}
			return sk.Sign(b)
		},
	)
	return nKeyOption
}

func buildJwtBearerOption(activeAuth *Auth) nats.Option {
	jwtOption := nats.UserJWT(
		func() (string, error) { return activeAuth.Jwt, nil },
		func([]byte) ([]byte, error) { return []byte{}, nil },
	)
	return jwtOption
}
