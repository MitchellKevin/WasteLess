const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

const make = (paths, strokeWidth = 1.8) =>
  function Icon({ size = 22, ...rest }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={strokeWidth} {...base} {...rest}>
        {paths}
      </svg>
    )
  }

export const LeafIcon = make(<><path d="M5 19c0-8 4-13 14-14 0 10-5 14-13 14z" /><path d="M5 19c3-4 6-7 10-9" /></>, 2)
export const HomeIcon = make(<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />)
export const PantryIcon = make(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M5 11h14M8 7v1.5M8 14v3" /></>)
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />, 2.2)
export const MinusIcon = make(<path d="M5 12h14" />, 2.2)
export const RecipesIcon = make(<><path d="M4 11h16v2a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z" /><path d="M9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2" /></>)
// Three separate bars so they can be animated one by one
export const ImpactIcon = make(<><path d="M5 19V11" /><path d="M12 19V5" /><path d="M19 19v-9" /></>)
export const CartIcon = make(<><path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" /><circle cx="9" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></>)
export const HouseholdIcon = make(<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3 3 0 0 1 0 5M18 14.5c1.8.8 3 2.6 3 5.5" /></>)
export const SettingsIcon = make(<><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>)
export const BellIcon = make(<><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" /><path d="M10 21h4" /></>)
export const TargetIcon = make(<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>)
export const LogoutIcon = make(<><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" /><path d="M10 17l-5-5 5-5M5 12h11" /></>)
export const SearchIcon = make(<><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>)
export const PencilIcon = make(<><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>)
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />, 2)
export const CheckIcon = make(<path d="m5 12.5 4.5 4.5L19 7" />, 2.2)
export const TrashIcon = make(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>)
export const SnowflakeIcon = make(<><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" /><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" /></>)
export const CameraIcon = make(<><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></>)
export const BarcodeIcon = make(<><path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2" /><path d="M8 8v8M11 8v8M14 8v8M17 8v8" /></>)
export const UploadIcon = make(<><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>)
export const ShareIcon = make(<><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" /><path d="M7 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" /></>)
export const AlertIcon = make(<><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4M12 17v.01" /></>)
export const ClockIcon = make(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>)
export const ExternalIcon = make(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>)
export const ChevronIcon = make(<path d="m9 6 6 6-6 6" />, 2)
export const BackIcon = make(<path d="m15 6-6 6 6 6" />, 2)
