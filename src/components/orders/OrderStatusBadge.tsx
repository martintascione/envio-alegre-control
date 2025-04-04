
import { ShippingStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { shippingStatusMap } from "@/lib/data";

interface OrderStatusBadgeProps {
  status: ShippingStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const getStatusClass = () => {
    switch (status) {
      case "purchased":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "shipped_to_warehouse":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "received_at_warehouse":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in_transit_to_argentina":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "arrived_in_argentina":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Badge variant="outline" className={`${getStatusClass()} ${className || ""}`}>
      {shippingStatusMap[status]}
    </Badge>
  );
}
