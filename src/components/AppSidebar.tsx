
import { Home, Users, Package, Settings, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/",
  },
  {
    title: "Clientes",
    icon: Users,
    url: "/clients",
  },
  {
    title: "Pedidos",
    icon: Package,
    url: "/orders",
  },
  {
    title: "Configuración",
    icon: Settings,
    url: "/settings",
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="flex justify-center py-6">
        <h1 className="font-bold text-2xl text-white">
          <span className="text-brand-cyan">Envio</span>Alegre
        </h1>
        <SidebarTrigger className="absolute right-4 text-white" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 pt-2">
          <div className="flex items-center mb-2 px-4 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
            <LogOut className="h-5 w-5 mr-3" />
            <span>Cerrar sesión</span>
          </div>
          <div className="px-4 py-4 text-sm opacity-70">
            © 2025 EnvioAlegre
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
