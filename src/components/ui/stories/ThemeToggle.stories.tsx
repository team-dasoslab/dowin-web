import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";

const meta: Meta<typeof ThemeToggle> = {
  title: "UI/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="ko" messages={{ Profile: { themeLight: "라이트 모드", themeDark: "다크 모드", themeSystem: "시스템" } }}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {
  args: {},
};
