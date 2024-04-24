import { theme } from '@/constants/theme'
import CommonButton from '../common/Button/CommonButton'
import { AlertBackground, type AlertModalProps, Content } from './AlertModal'
import ModalPortal from './ModalPortal'

function AuthAlertModal({
  onClose,
  handleClick,
  message,
  firstSubMessage,
  secondSubMessage,
  buttonName,
}: AlertModalProps): JSX.Element {
  return (
    <ModalPortal>
      <AlertBackground onClick={onClose}>
        <Content>
          <img src="/assets/modalIcon.svg" alt="로그아웃" />
          <div>
            정말 <span className="emphasis">{message}</span> 하시겠습니까?
          </div>
          <div className="subContainer">
            <span className="sub">{firstSubMessage}</span>
            <span className="sub">{secondSubMessage}</span>
          </div>
          <div className="buttonBox">
            <CommonButton
              size="small"
              handleClick={onClose}
              style={{
                width: '15rem',
                color: `${theme.color.black40}`,
                backgroundColor: `${theme.color.black20}`,
                borderRadius: '8px',
              }}
            >
              취소
            </CommonButton>
            <CommonButton
              size="small"
              handleClick={handleClick}
              style={{
                width: '15rem',
                color: `${theme.color.white}`,
                borderRadius: '8px',
              }}
            >
              {buttonName}
            </CommonButton>
          </div>
        </Content>
      </AlertBackground>
    </ModalPortal>
  )
}

export default AuthAlertModal
