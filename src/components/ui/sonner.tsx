import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      offset={{ top: "92px" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast moxera-payment-toast !text-white !border-white/30 !shadow-2xl !rounded-[22px]",
          title: "!text-white !font-extrabold !text-base",
          description: "!text-white/90 !text-sm",
          icon: "!text-white",
          actionButton: "group-[.toast]:!bg-white group-[.toast]:!text-primary",
          cancelButton: "group-[.toast]:!bg-white/20 group-[.toast]:!text-primary-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
