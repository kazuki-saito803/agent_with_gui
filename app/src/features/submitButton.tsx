import { HandHelping } from 'lucide-react'
import CustomButton from '../components/customButton'

const handlSubmit = () => {
    console.log("Hello world")
    return <p>hello</p>
}

type CustomButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const submitButton: React.FC<CustomButtonProps> = () => {
    return (
        <>
            <CustomButton onClick={handlSubmit}>送信</CustomButton>
        </>
    )
}
export default submitButton;