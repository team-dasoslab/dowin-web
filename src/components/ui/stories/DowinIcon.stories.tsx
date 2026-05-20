import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ICON_MAP, IconName, DowinIcon } from "../DowinIcon";

const meta: Meta<typeof DowinIcon> = {
  title: "UI/DowinIcon",
  component: DowinIcon,
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "select",
      options: Object.keys(ICON_MAP),
    },
    size: {
      control: "text",
    },
  },
};

export default meta;
type Story = StoryObj<typeof DowinIcon>;

export const Default: Story = {
  args: {
    name: "domain-flash-active",
    size: "24px",
    className: "text-primary",
  },
};

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {(Object.keys(ICON_MAP) as IconName[]).sort().map((name) => (
        <div
          key={name}
          className="flex flex-col items-center justify-center p-4 border border-zinc-100 rounded-content bg-white transition-all group"
        >
          <DowinIcon
            name={name}
            size="24px"
            className="mb-2 text-zinc-400 transition-colors"
          />
          <span className="text-[10px] font-mono text-zinc-500 transition-colors truncate w-full text-center">
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <DowinIcon
          name="domain-flash-active"
          size="16px"
          className="text-primary"
        />
        <span className="text-[10px] text-zinc-500">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DowinIcon
          name="domain-flash-active"
          size="20px"
          className="text-primary"
        />
        <span className="text-[10px] text-zinc-500">20px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DowinIcon
          name="domain-flash-active"
          size="24px"
          className="text-primary"
        />
        <span className="text-[10px] text-zinc-500">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DowinIcon
          name="domain-flash-active"
          size="32px"
          className="text-primary"
        />
        <span className="text-[10px] text-zinc-500">32px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <DowinIcon
          name="domain-flash-active"
          size="48px"
          className="text-primary"
        />
        <span className="text-[10px] text-zinc-500">48px</span>
      </div>
    </div>
  ),
};
