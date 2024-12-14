import { SVGProps } from 'react'

export const BaseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill="#0052FF"
      d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z"
    />
    <path
      fill="#fff"
      fillRule="evenodd"
      d="M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm3.857 10.928a.75.75 0 01-1.06 0l-2.797-2.797-2.797 2.797a.75.75 0 11-1.06-1.06l2.797-2.797-2.797-2.797a.75.75 0 011.06-1.06l2.797 2.796 2.797-2.797a.75.75 0 111.06 1.06l-2.796 2.798 2.797 2.797a.75.75 0 010 1.06z"
      clipRule="evenodd"
    />
  </svg>
)
