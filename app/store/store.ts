// store.ts

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { baseApi } from "./api/baseApi";
import { publicApi } from "./api/publicApi";
import "@/app/store/api/leave-balances/leaveBalancesApi";
import "@/app/store/api/profile/profileApi";
import "@/app/store/api/branches/branchesApi";
import "@/app/store/api/departments/departmentsApi";
import "@/app/store/api/employees/employeesApi";
import "@/app/store/api/positions/positionsApi";
import "@/app/store/api/leave-requests/leaveRequestsApi";
import "@/app/store/api/leave-types/leaveTypesApi";
import "@/app/store/api/public/publicOrgApi";
import "@/app/store/api/system-files/systemFilesApi";
import "@/app/store/api/overview/overviewApi";
import "@/app/store/api/imports/attendanceImportApi";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [publicApi.reducerPath]: publicApi.reducer,
    },

    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware, publicApi.middleware),
  });

  setupListeners(store.dispatch);

  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];