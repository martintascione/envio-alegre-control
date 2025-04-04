
import { DashboardStats } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Clock, CheckCircle } from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total de Clientes",
      value: stats.totalClients,
      icon: <Users className="h-8 w-8 text-brand-blue" />,
      description: `${stats.activeClients} activos · ${stats.pendingClients} pendientes · ${stats.finishedClients} finalizados`,
    },
    {
      title: "Total de Pedidos",
      value: stats.totalOrders,
      icon: <Package className="h-8 w-8 text-brand-cyan" />,
      description: `${stats.pendingOrders} en proceso · ${stats.completedOrders} entregados`,
    },
    {
      title: "Pedidos Pendientes",
      value: stats.pendingOrders,
      icon: <Clock className="h-8 w-8 text-brand-orange" />,
      description: "Pedidos en proceso de envío",
    },
    {
      title: "Pedidos Completados",
      value: stats.completedOrders,
      icon: <CheckCircle className="h-8 w-8 text-green-600" />,
      description: "Pedidos entregados satisfactoriamente",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
