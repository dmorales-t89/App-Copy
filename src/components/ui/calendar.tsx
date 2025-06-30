"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-between items-center pt-1 relative",
        caption_label: "text-sm font-medium text-[#011936]",
        nav: "flex items-center space-x-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-[#C2EABD] text-[#011936] hover:bg-[#C2EABD]/30"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-[#011936] rounded-md w-8 font-normal text-xs flex items-center justify-center text-gray-500",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
        day: cn(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-[#011936] rounded-md hover:bg-[#C2EABD]/30 hover:text-[#011936] transition-colors focus:bg-[#C2EABD]/30 focus:text-[#011936] focus:outline-none"
        ),
        day_range_end: "day-range-end",
        day_selected: "bg-[#C2EABD] text-[#011936] hover:bg-[#A3D5FF] hover:text-[#011936] focus:bg-[#C2EABD] focus:text-[#011936]",
        day_today: "bg-[#A3D5FF] text-[#011936] font-medium",
        day_outside: "day-outside text-gray-300 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconPrevious: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconNext: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }