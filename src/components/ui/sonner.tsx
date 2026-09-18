import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      offset={{ top: "18px" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !bg-primary !text-primary-foreground !border-primary/70 !shadow-2xl !rounded-2xl",
          title: "!text-primary-foreground !font-extrabold",
          description: "!text-primary-foreground/90",
          icon: "!text-primary-foreground",
          actionButton: "group-[.toast]:!bg-white group-[.toast]:!text-primary",
          cancelButton: "group-[.toast]:!bg-white/20 group-[.toast]:!text-primary-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
