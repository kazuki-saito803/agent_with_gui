import React from "react";

type messageInputProps = React.InputHTMLAttributes<HTMLInputElement>

const messageInput: React.FC<messageInputProps> = ({...props}) => {
    return (
        <>
            <input {...props}></input>
        </>
    )
}

export default messageInput