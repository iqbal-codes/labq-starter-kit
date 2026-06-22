import React from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "../../runtime";
import type { CompanyRow, ContactRow, OptionItem, StageRow } from "./types";

function buildOptions(items: Array<{ id: string; name: string }>): OptionItem[] {
  return items.map((item) => ({ value: item.id, label: item.name }));
}

export function useCrmLookups() {
  const { data: companiesData } = useQuery(
    orpc.crm.companies.list.queryOptions({ input: { page: 1, pageSize: 200 } }),
  );
  const { data: contactsData } = useQuery(
    orpc.crm.contacts.list.queryOptions({ input: { page: 1, pageSize: 200 } }),
  );
  const { data: stagesData } = useQuery(
    orpc.crm.stages.list.queryOptions({ input: { includeRetired: false } }),
  );

  const companies = React.useMemo(
    () => ((companiesData as { items?: CompanyRow[] } | undefined)?.items ?? []) as CompanyRow[],
    [companiesData],
  );
  const contacts = React.useMemo(
    () => ((contactsData as { items?: ContactRow[] } | undefined)?.items ?? []) as ContactRow[],
    [contactsData],
  );
  const stages = React.useMemo(
    () => ((stagesData as StageRow[] | undefined) ?? []) as StageRow[],
    [stagesData],
  );

  const companyNameById = React.useMemo(() => {
    return new Map(companies.map((company) => [company.id, company.name]));
  }, [companies]);

  const contactNameById = React.useMemo(() => {
    return new Map(contacts.map((contact) => [contact.id, contact.name]));
  }, [contacts]);

  const stageNameById = React.useMemo(() => {
    return new Map(stages.map((stage) => [stage.id, stage.name]));
  }, [stages]);

  const companyOptions = React.useMemo(() => buildOptions(companies), [companies]);
  const contactOptions = React.useMemo(() => buildOptions(contacts), [contacts]);
  const stageOptions = React.useMemo(() => buildOptions(stages), [stages]);

  return {
    companies,
    contacts,
    stages,
    companyOptions,
    contactOptions,
    stageOptions,
    companyNameById,
    contactNameById,
    stageNameById,
  };
}
