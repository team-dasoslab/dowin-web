import { Card } from "@/components/ui/Card";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-2">
        <h3 className="font-bold">Card Title</h3>
        <p className="text-sm text-text-secondary">
          This is a basic card content.
        </p>
      </div>
    ),
    className: "p-6 border border-border rounded-lg shadow-sm bg-white",
  },
};

export const SubBackground: Story = {
  args: {
    children: <p className="text-sm">Card with sub-background color.</p>,
    className: "p-4 bg-sub-background border border-border rounded-lg",
  },
};

export const Complex: Story = {
  args: {
    children: (
      <div className="divide-y divide-border">
        <div className="p-4 font-bold bg-sub-background">Header</div>
        <div className="p-6">Body content goes here</div>
        <div className="p-4 text-xs text-text-muted text-right">Footer</div>
      </div>
    ),
    className: "border border-border rounded-lg overflow-hidden bg-white",
  },
};
