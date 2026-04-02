import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import Layout from "./components/layout/Layout";
import BankImport from "./pages/BankImport";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Login from "./pages/Login";
import MedicineMaster from "./pages/MedicineMaster";
import Medicines from "./pages/Medicines";
import PatientDetail from "./pages/PatientDetail";
import Patients from "./pages/Patients";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Vendors from "./pages/Vendors";
import Visits from "./pages/Visits";
import WhatsApp from "./pages/WhatsApp";
import { useAuthStore } from "./store/authStore";

function ProtectedLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) {
    throw redirect({ to: "/login" });
  }
  return <Layout />;
}

const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: ProtectedLayout,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: "/login" });
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: Dashboard,
});

const patientsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/patients",
  component: Patients,
});

const patientDetailRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/patients/$patientId",
  component: PatientDetail,
});

const visitsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/visits",
  component: Visits,
});

const billingRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/billing",
  component: Billing,
});

const medicinesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/medicines",
  component: Medicines,
});

const vendorsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/vendors",
  component: Vendors,
});

const expensesRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/expenses",
  component: Expenses,
});

const reportsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/reports",
  component: Reports,
});

const medicineMasterRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/medicine-master",
  component: MedicineMaster,
});

const whatsappRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/whatsapp",
  component: WhatsApp,
});

const bankImportRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/bank-import",
  component: BankImport,
});

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/settings",
  component: Settings,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  layoutRoute.addChildren([
    dashboardRoute,
    patientsRoute,
    patientDetailRoute,
    visitsRoute,
    billingRoute,
    medicinesRoute,
    vendorsRoute,
    expensesRoute,
    reportsRoute,
    settingsRoute,
    medicineMasterRoute,
    whatsappRoute,
    bankImportRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
