import { SmartBackButton } from "@/components/ui/SmartBackButton";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

const meta: Meta<typeof SmartBackButton> = {
  title: "UI/SmartBackButton",
  component: SmartBackButton,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={{ Common: { back: "뒤로 가기" } }}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SmartBackButton>;

export const Default: Story = {
  args: {
    fallbackHref: "/",
  },
};
