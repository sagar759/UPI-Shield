import * as React from "react";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@/components/ui/segmented-control";
import type { AnalyzerMode } from "@/lib/navigation/analyze-search-state";
import { ArrowRightLeft, MessageSquare, UserCheck } from "lucide-react";

export interface AnalyzerModeControlProps {
  value: AnalyzerMode;
  onChange: (mode: AnalyzerMode) => void;
  className?: string;
  disabled?: boolean;
}

export function AnalyzerModeControl({
  value,
  onChange,
  className,
  disabled = false,
}: AnalyzerModeControlProps) {
  const options: SegmentedControlOption[] = React.useMemo(
    () => [
      {
        value: "transaction",
        label: "Transaction",
        icon: <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />,
      },
      {
        value: "message",
        label: "Scam message",
        icon: <MessageSquare className="w-4 h-4" aria-hidden="true" />,
      },
      {
        value: "receiver",
        label: "Receiver",
        icon: <UserCheck className="w-4 h-4" aria-hidden="true" />,
      },
    ],
    []
  );

  return (
    <SegmentedControl
      options={options}
      value={value}
      onChange={(val) => onChange(val as AnalyzerMode)}
      label="Select risk analyzer mode"
      name="analyzer-mode-selection"
      disabled={disabled}
      className={className}
    />
  );
}
