import { useRef } from 'react';

export interface ChapterPageRef {
	reload: () => void;
}

const useChapterPageErrors = () => {
	const failedRefs = useRef<Record<string, ChapterPageRef>>({});

	const registerFailedPage = (id: string, ref: ChapterPageRef) => {
		failedRefs.current[id] = ref;
	};

	const unregisterFailedPage = (id: string) => {
		delete failedRefs.current[id];
	};

	const reloadAllFailed = () => {
		Object.values(failedRefs.current).forEach((ref) => ref.reload());
	};

	const reloadFailed = (pageId: string) => {
		if (failedRefs.current[pageId]) {
			failedRefs.current[pageId].reload();
		}
	};

	return {
		registerFailedPage,
		unregisterFailedPage,
		reloadAllFailed,
		reloadFailed,
		failedRefs, // if you ever want to inspect or target specific ones
	};
};

export default useChapterPageErrors;
