import { View, Text, Modal, StatusBar} from 'react-native'
import React, {useState} from 'react'

const ModalPopup = ({otherStyles, children, visible, handleClose}) => {
    const [showModal, setShowModal] = useState(visible)
    return (
    <View>
    <Modal
        visible={visible}
        transparent
        onRequestClose={handleClose}
        animationType='slide'
    >
        <View
            className={`justify-end items-center bg-black-100 p-1 h-full ${otherStyles} `}
        >
            <View className="h-[40%] w-full rounded-lg bg-secondary ">

            {children}
            </View>
        </View>    
    </Modal>
        </View>
  )
}

export default ModalPopup