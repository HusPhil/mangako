import { readerModeOptions } from "../../app/screens/_manga_reader"
import { READER_ACTIONS } from "./readerActions"

export const INITIAL_STATE = {
    chapterPages: [],
    isLoading: false,
    errorData: null,
    showModal: false,
    readingMode: readerModeOptions['2'],
}

export const readerReducer = (state, action) => {
    console.log(action.type)
    switch (action.type) {
        case READER_ACTIONS.GET_CHAPTER_PAGES:
            return {
                ...state,
                isLoading: true,
            };
        case READER_ACTIONS.GET_CHAPTER_PAGES_SUCCESS:
            return {
                ...state,
                chapterPages: action.payload,
                isLoading: false,
            };
        case READER_ACTIONS.GET_CHAPTER_PAGES_ERROR:
            return {
                ...state,
                error: action.payload,
            };
        case READER_ACTIONS.SET_READER_MODE:
            return {
                ...state,
                readingMode: action.payload,
            };
        case READER_ACTIONS.SHOW_MODAL:
            return {
                ...state,
                showModal: !action.payload
            };
        case READER_ACTIONS.EFFECT_CLEAN_UP:
            return INITIAL_STATE;
        default:
            return state;
    }
}