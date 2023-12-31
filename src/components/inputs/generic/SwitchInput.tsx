import { ReactNode } from "react"



/**
 * Option for a Switch
 */
export interface SwitchOption {
  value: string,
  label: ReactNode,
}


/**
 * Generic switch for the app
 */
export const SwitchInput = (props: {
  value?: string,
  options?: SwitchOption[],
  onChange?: (value: string) => void,
}) => {
  return (
    <div>
      <select
        className="appearance-none cursor-pointer px-1 border-b bg-transparent"
        value={props.value} onChange={e => props.onChange?.(e.target.value)}>
        {props.options?.map((option, i) => (
          <option key={i} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>

  )
}