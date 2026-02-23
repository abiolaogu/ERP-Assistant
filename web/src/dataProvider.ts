import type { DataProvider } from "@refinedev/core";
import { GraphQLClient, gql } from "graphql-request";

const API_URL =
  import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql";

const client = new GraphQLClient(API_URL);

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("erp_assistant_token");
  const tenantId = import.meta.env.VITE_TENANT_ID || "default";

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  headers["X-Tenant-ID"] = tenantId;

  return headers;
}

function buildSortClause(
  sorters?: Array<{ field: string; order: string }>
): string {
  if (!sorters || sorters.length === 0) return "";
  return sorters
    .map((s) => `{ field: "${s.field}", order: "${s.order}" }`)
    .join(", ");
}

function buildFilterClause(
  filters?: Array<{ field: string; operator: string; value: unknown }>
): string {
  if (!filters || filters.length === 0) return "";
  return filters
    .map(
      (f) =>
        `{ field: "${f.field}", operator: "${f.operator}", value: ${JSON.stringify(f.value)} }`
    )
    .join(", ");
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    const { current = 1, pageSize = 10 } = pagination ?? {};
    const sortClause = buildSortClause(sorters);
    const filterClause = buildFilterClause(filters);

    const query = gql`
      query GetList {
        ${resource}(
          pagination: { page: ${current}, perPage: ${pageSize} }
          ${sortClause ? `, sort: [${sortClause}]` : ""}
          ${filterClause ? `, filter: [${filterClause}]` : ""}
        ) {
          data {
            id
          }
          total
        }
      }
    `;

    try {
      const response = await client.request<Record<string, { data: unknown[]; total: number }>>(
        query,
        {},
        getHeaders()
      );
      const result = response[resource];
      return { data: result.data as never[], total: result.total };
    } catch {
      return { data: [], total: 0 };
    }
  },

  getOne: async ({ resource, id }) => {
    const singularResource = resource.replace(/s$/, "");
    const query = gql`
      query GetOne {
        ${singularResource}(id: "${id}") {
          id
        }
      }
    `;

    try {
      const response = await client.request<Record<string, unknown>>(
        query,
        {},
        getHeaders()
      );
      return { data: response[singularResource] as never };
    } catch {
      return { data: {} as never };
    }
  },

  create: async ({ resource, variables }) => {
    const singularResource = resource.replace(/s$/, "");
    const mutation = gql`
      mutation Create($input: ${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}Input!) {
        create${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}(input: $input) {
          id
        }
      }
    `;

    try {
      const response = await client.request<Record<string, unknown>>(
        mutation,
        { input: variables },
        getHeaders()
      );
      const key = `create${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}`;
      return { data: response[key] as never };
    } catch {
      return { data: {} as never };
    }
  },

  update: async ({ resource, id, variables }) => {
    const singularResource = resource.replace(/s$/, "");
    const mutation = gql`
      mutation Update($id: ID!, $input: ${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}Input!) {
        update${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}(id: $id, input: $input) {
          id
        }
      }
    `;

    try {
      const response = await client.request<Record<string, unknown>>(
        mutation,
        { id, input: variables },
        getHeaders()
      );
      const key = `update${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}`;
      return { data: response[key] as never };
    } catch {
      return { data: {} as never };
    }
  },

  deleteOne: async ({ resource, id }) => {
    const singularResource = resource.replace(/s$/, "");
    const mutation = gql`
      mutation Delete($id: ID!) {
        delete${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}(id: $id) {
          id
        }
      }
    `;

    try {
      const response = await client.request<Record<string, unknown>>(
        mutation,
        { id },
        getHeaders()
      );
      const key = `delete${singularResource.charAt(0).toUpperCase() + singularResource.slice(1)}`;
      return { data: response[key] as never };
    } catch {
      return { data: {} as never };
    }
  },

  getApiUrl: () => API_URL,
};
