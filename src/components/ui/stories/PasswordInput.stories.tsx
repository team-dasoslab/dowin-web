import { PasswordInput } from "@/components/ui/PasswordInput";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof PasswordInput> = {
  title: "UI/PasswordInput",
  component: PasswordInput,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PasswordInput>;

export const Default: Story = {
  args: {
    placeholder: "••••••••",
    className:
      "w-full rounded-lg border border-border bg-white px-3 py-3 pr-20 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary",
    toggleClassName:
      "absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[11px] font-semibold text-text-muted transition-colors hover:text-text-primary",
  },
};
