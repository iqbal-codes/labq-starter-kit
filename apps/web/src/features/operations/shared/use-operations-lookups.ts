import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { CustomerRow, OptionItem, ServiceRow } from "./types";
import {
  operationsCustomerListQueryOptions,
  operationsServiceListQueryOptions,
} from "../api/queries";

export function useOperationsLookups() {
  const { data: customersData } = useQuery(
    operationsCustomerListQueryOptions({ page: 1, pageSize: 200 }),
  );
  const { data: servicesData } = useQuery(
    operationsServiceListQueryOptions({ page: 1, pageSize: 200, status: "active" }),
  );

  const customers = React.useMemo(
    () => ((customersData as { items?: CustomerRow[] } | undefined)?.items ?? []) as CustomerRow[],
    [customersData],
  );
  const services = React.useMemo(
    () => ((servicesData as { items?: ServiceRow[] } | undefined)?.items ?? []) as ServiceRow[],
    [servicesData],
  );

  const customerNameById = React.useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer.name])),
    [customers],
  );
  const serviceNameById = React.useMemo(
    () => new Map(services.map((service) => [service.id, service.name])),
    [services],
  );

  const customerOptions = React.useMemo<OptionItem[]>(
    () => customers.map((customer) => ({ value: customer.id, label: customer.name })),
    [customers],
  );
  const serviceOptions = React.useMemo<OptionItem[]>(
    () => services.map((service) => ({ value: service.id, label: service.name })),
    [services],
  );

  return {
    customerOptions,
    serviceOptions,
    customerNameById,
    serviceNameById,
  };
}
