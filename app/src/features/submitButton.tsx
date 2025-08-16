import { HandHelping } from 'lucide-react'
import CustomButton from '../components/customButton'

type CustomButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
const SubmitButton: React.FC<CustomButtonProps> = ({...props}) => {
    return (
        <>
            <CustomButton {...props}>📩</CustomButton>
        </>
    )
}
export default SubmitButton;