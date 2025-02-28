import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import NodeInfoView from "../views/NodeInfoView.vue";
import DepositView from "../views/DepositView.vue";
import SwapView from "../views/SwapView.vue";
import WithdrawView from "../views/WithdrawView.vue";

const routes = [
  { path: "/", component: HomeView },
  { path: "/node-info", component: NodeInfoView },
  { path: "/deposit", component: DepositView },
  { path: "/swap", component: SwapView},
  { path: "/withdraw", name: "Withdraw", component: WithdrawView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
