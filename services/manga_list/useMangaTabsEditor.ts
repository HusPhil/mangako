import { useState } from "react";



const useMangaTabsEditor = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    return {
        isModalVisible,
        setIsModalVisible
    }
}

export default useMangaTabsEditor;
