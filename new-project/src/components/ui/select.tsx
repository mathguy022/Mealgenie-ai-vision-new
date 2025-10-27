import React from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  value: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export const Select: React.FC<SelectProps> = ({ children, value, onValueChange }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = "", children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext);

    return (
      <button
        ref={ref}
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        onClick={() => setOpen(!open)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  
  return (
    <span className={value ? "" : "text-muted-foreground"}>
      {value || placeholder}
    </span>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ className = "", children }) => {
  const { open } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <div className={`absolute top-full left-0 z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md ${className}`}>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
};

export const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(
  ({ className = "", value, children, ...props }, ref) => {
    const { onValueChange, setOpen } = React.useContext(SelectContext);

    const handleClick = () => {
      onValueChange?.(value);
      setOpen(false);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${className}`}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);

SelectItem.displayName = "SelectItem";