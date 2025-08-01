import aboutSetup from "@/stores/stacks/about";
import bucketsSetup from "@/stores/stacks/buckets";
import bucketSetup from "@/stores/stacks/buckets/detail";
import cnnSetup from "@/stores/stacks/connection";
import clientMetricsSetup from "@/stores/stacks/connection/clients";
import servicesSetup from "@/stores/stacks/connection/detail";
import messageSendSetup from "@/stores/stacks/connection/messageSend";
import messagesSetup from "@/stores/stacks/connection/messages";
import cnnMetricsSetup from "@/stores/stacks/connection/metrics";
import consumersSetup from "@/stores/stacks/consumer";
import consumerSetup from "@/stores/stacks/consumer/detail";
import helpSetup from "@/stores/stacks/help";
import kventriesSetup from "@/stores/stacks/kventry";
import kventrySetup from "@/stores/stacks/kventry/detail";
import logsSetup from "@/stores/stacks/log";
import messageSetup, { MessageState } from "@/stores/stacks/message";
import streamsSetup from "@/stores/stacks/streams";
import streamSetup from "@/stores/stacks/streams/detail";
import streamMessagesSetup from "@/stores/stacks/streams/messages";
import syncSetup from "@/stores/stacks/sync";
import { DOC_TYPE } from "@/types";
import { Message } from "@/types/Message";
import { MSG_FORMAT } from "@/utils/editor";
import { createStore } from "@priolo/jon";
import cnnImportSetup from "../../stacks/cnnImport";
import jsonConfigSetup from "../../stacks/jsonconfig";
import shortcutSetup from "../../stacks/shortcut";
import { ViewState, ViewStore } from "../../stacks/viewBase";



/** crea lo STORE adeguato */
export function buildStore(state: Partial<ViewState>, stateSerializzation?: Partial<ViewState>): ViewStore {
	const setup = {
		[DOC_TYPE.CONNECTIONS]: cnnSetup,
		[DOC_TYPE.CONNECTION]: servicesSetup,
		[DOC_TYPE.CNN_LOADER]: cnnImportSetup,		
		[DOC_TYPE.CNN_METRICS]: cnnMetricsSetup,
		[DOC_TYPE.CLIENT_METRICS]: clientMetricsSetup,

		[DOC_TYPE.MESSAGES]: messagesSetup,
		[DOC_TYPE.MESSAGE]: messageSetup,
		[DOC_TYPE.MESSAGE_SEND]: messageSendSetup,

		[DOC_TYPE.STREAMS]: streamsSetup,
		[DOC_TYPE.STREAM]: streamSetup,
		[DOC_TYPE.STREAM_MESSAGES]: streamMessagesSetup,

		[DOC_TYPE.BUCKETS]: bucketsSetup,
		[DOC_TYPE.BUCKET]: bucketSetup,
		[DOC_TYPE.KVENTRIES]: kventriesSetup,
		[DOC_TYPE.KVENTRY]: kventrySetup,

		[DOC_TYPE.CONSUMERS]: consumersSetup,
		[DOC_TYPE.CONSUMER]: consumerSetup,

		[DOC_TYPE.LOGS]: logsSetup,
		[DOC_TYPE.ABOUT]: aboutSetup,

		[DOC_TYPE.HELP]: helpSetup,
		[DOC_TYPE.SYNC]: syncSetup,
		[DOC_TYPE.JSON_CONFIG]: jsonConfigSetup,
		[DOC_TYPE.SHORTCUT]: shortcutSetup,
	}[state?.type]
	if (!setup) return
	const store: ViewStore = <ViewStore>createStore(setup)
	store.state = { ...store.state, ...state };
	// se non c'e' l'uuid lo creo IO!
	//if (store.state.uuid == null) store.state.uuid = createUUID()
	if (stateSerializzation) store.setSerialization(stateSerializzation);
	(<any>store).onCreated?.()
	return store
}

//#region MESSAGES

export function buildMessageDetail(message: Message, format: MSG_FORMAT, autoFormat: boolean = true) {
	if (!message) { console.error("no param"); return null }
	const msgStore = buildStore({
		type: DOC_TYPE.MESSAGE,
		message,
		format,
		autoFormat,
	} as MessageState)
	return msgStore
}

//#endregion
