import { HandHelping } from 'lucide-react'
import CustomButton from '../components/customButton'

const handlSubmit = () => {
    console.log("Hello world")
    return <p>hello</p>
}

type CustomButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const submitButton: React.FC<CustomButtonProps> = ({children}) => {
    return (
        <>
            <CustomButton onClick={handlSubmit}>{children}</CustomButton>
        </>
    )
}
export default submitButton;