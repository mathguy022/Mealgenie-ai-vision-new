import React from "react";

interface TabsContextValue {
  value?: string;
  setValue: (v: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  className = "",
  children,
  ...props
}) => {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    value ?? defaultValue
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const setValue = (v: string) => {
    if (onValueChange) onValueChange(v);
    if (value === undefined) setInternalValue(v);
  };

  return (
    <TabsContext.Provider value={{ value: internalValue, setValue }}>
      <div className={`w-full ${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className = "", value, children, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = ctx.value === value;

    return (
      <button
        ref={ref}
        type="button"
        data-state={isActive ? "active" : "inactive"}
        className={`inline-flex min-w-[120px] items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
          isActive
            ? "bg-background text-foreground shadow"
            : "bg-transparent text-muted-foreground"
        } ${className}`}
        onClick={() => ctx.setValue(value)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className = "", value, children, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsContent must be used within Tabs");

    const isActive = ctx.value === value;

    return (
      <div
        ref={ref}
        role="tabpanel"
        hidden={!isActive}
        data-state={isActive ? "active" : "inactive"}
        className={`mt-2 ${className}`}
        {...props}
      >
        {isActive ? children : null}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";