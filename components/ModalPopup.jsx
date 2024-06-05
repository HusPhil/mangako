import { View, Text, Modal, } from 'react-native'
import React, {useState} from 'react'

const ModalPopup = ({otherStyles, children, visible, handleClose}) => {
    const [showModal, setShowModal] = useState(visible)
    return (
    <Modal
        visible={visible}
        transparent
        onRequestClose={handleClose}
        animationType='slide'
    >
        <View
            className={`flex-1 justify-center items-center h-full bg-black-100 ${otherStyles}`}
        >
            {children}
        </View>    
    </Modal>
  )
}

export default ModalPopup