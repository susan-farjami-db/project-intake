import { useQuery, useSuspenseQuery, useMutation } from "@tanstack/react-query";
import type { UseQueryOptions, UseSuspenseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
export class ApiError extends Error {
    status: number;
    statusText: string;
    body: unknown;
    constructor(status: number, statusText: string, body: unknown){
        super(`HTTP ${status}: ${statusText}`);
        this.name = "ApiError";
        this.status = status;
        this.statusText = statusText;
        this.body = body;
    }
}
export interface CatalogOut {
    data_note: string;
    effort_estimates: string[];
    intake_types: string[];
    sensitive_data: string[];
    solution_types: string[];
    statuses: string[];
    strategic_alignments: string[];
}
export interface ClassifyIn {
    problem_statement?: string;
    request_title?: string;
    solution_summary?: string;
    solution_type?: string;
    systems_data_involved?: string;
}
export interface ClassifyOut {
    intake_type: "AI" | "Data" | "Analytics" | "Other";
    source: "ai_classify" | "heuristic";
}
export interface CurrentUserOut {
    active?: boolean;
    display_name: string;
    emails?: Record<string, string | boolean>[];
    entitlements?: Record<string, string>[];
    external_id?: string | null;
    groups?: Record<string, string>[];
    id: string;
    name?: Record<string, string> | null;
    roles?: Record<string, string>[];
    user_name: string;
}
export interface DuplicateClusterOut {
    id: string;
    label: string;
    projects: ProjectOut[];
    score: number;
}
export interface DuplicateMatchOut {
    band: "likely" | "possible";
    project: ProjectOut;
    reasons: string[];
    score: number;
}
export interface DuplicateScanIn {
    business_dept?: string;
    exclude_id?: string | null;
    problem_statement?: string;
    request_title?: string;
    solution_summary?: string;
    solution_type?: string;
}
export interface DuplicateScanOut {
    matches: DuplicateMatchOut[];
    scanned_count: number;
}
export interface HTTPValidationError {
    detail?: ValidationError[];
}
export interface ProjectIn {
    acknowledge_duplicates?: boolean;
    business_dept?: string;
    current_process?: string;
    desired_timeframe?: string;
    effort_estimate?: "" | "S" | "M" | "L";
    estimated_user_population?: string;
    executive_sponsor?: string;
    expected_benefit?: string;
    links?: string;
    notes?: string;
    problem_statement?: string;
    readiness_score?: string;
    request_title: string;
    requestor: string;
    sensitive_data?: "Y" | "N";
    solution_summary?: string;
    solution_type: string;
    status?: "New" | "Initial review completed" | "Ready for prioritization" | "Prioritized" | "Moved to active mission";
    strategic_alignment?: "" | "Strategic Initiative" | "Annual Goal";
    systems_data_involved?: string;
}
export interface ProjectListOut {
    items: ProjectOut[];
    likely_duplicate_pairs: number;
    mock_data?: boolean;
    total: number;
}
export interface ProjectOut {
    business_dept: string;
    current_process: string;
    desired_timeframe: string;
    effort_estimate?: "" | "S" | "M" | "L";
    estimated_user_population: string;
    executive_sponsor: string;
    expected_benefit: string;
    id: string;
    intake_type: "AI" | "Data" | "Analytics" | "Other";
    intake_type_source: "ai_classify" | "heuristic";
    links: string;
    notes: string;
    problem_statement: string;
    readiness_score?: string;
    request_title: string;
    requestor: string;
    sensitive_data: "Y" | "N";
    solution_summary: string;
    solution_type: string;
    status: "New" | "Initial review completed" | "Ready for prioritization" | "Prioritized" | "Moved to active mission";
    strategic_alignment?: "" | "Strategic Initiative" | "Annual Goal";
    submitted_at: string;
    systems_data_involved: string;
}
export interface ProjectUpdate {
    business_dept?: string | null;
    current_process?: string | null;
    desired_timeframe?: string | null;
    effort_estimate?: "" | "S" | "M" | "L" | null;
    estimated_user_population?: string | null;
    executive_sponsor?: string | null;
    expected_benefit?: string | null;
    links?: string | null;
    notes?: string | null;
    problem_statement?: string | null;
    readiness_score?: string | null;
    reclassify?: boolean;
    request_title?: string | null;
    requestor?: string | null;
    sensitive_data?: "Y" | "N" | null;
    solution_summary?: string | null;
    solution_type?: string | null;
    status?: "New" | "Initial review completed" | "Ready for prioritization" | "Prioritized" | "Moved to active mission" | null;
    strategic_alignment?: "" | "Strategic Initiative" | "Annual Goal" | null;
    systems_data_involved?: string | null;
}
export interface ValidationError {
    ctx?: Record<string, unknown>;
    input?: unknown;
    loc: (string | number)[];
    msg: string;
    type: string;
}
export interface VersionOut {
    version: string;
}
export const getCatalog = async (options?: RequestInit): Promise<{
    data: CatalogOut;
}> =>{
    const res = await fetch("/api/catalog", {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getCatalogKey = ()=>{
    return [
        "/api/catalog"
    ] as const;
};
export function useGetCatalog<TData = {
    data: CatalogOut;
}>(options?: {
    query?: Omit<UseQueryOptions<{
        data: CatalogOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getCatalogKey(),
        queryFn: ()=>getCatalog(),
        ...options?.query
    });
}
export function useGetCatalogSuspense<TData = {
    data: CatalogOut;
}>(options?: {
    query?: Omit<UseSuspenseQueryOptions<{
        data: CatalogOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getCatalogKey(),
        queryFn: ()=>getCatalog(),
        ...options?.query
    });
}
export interface CurrentUserParams {
    "X-Forwarded-Host"?: string | null;
    "X-Forwarded-Preferred-Username"?: string | null;
    "X-Forwarded-User"?: string | null;
    "X-Forwarded-Email"?: string | null;
    "X-Request-Id"?: string | null;
    "X-Forwarded-Access-Token"?: string | null;
}
export const currentUser = async (params?: CurrentUserParams, options?: RequestInit): Promise<{
    data: CurrentUserOut;
}> =>{
    const res = await fetch("/api/current-user", {
        ...options,
        method: "GET",
        headers: {
            ...(params?.["X-Forwarded-Host"] != null && {
                "X-Forwarded-Host": params["X-Forwarded-Host"]
            }),
            ...(params?.["X-Forwarded-Preferred-Username"] != null && {
                "X-Forwarded-Preferred-Username": params["X-Forwarded-Preferred-Username"]
            }),
            ...(params?.["X-Forwarded-User"] != null && {
                "X-Forwarded-User": params["X-Forwarded-User"]
            }),
            ...(params?.["X-Forwarded-Email"] != null && {
                "X-Forwarded-Email": params["X-Forwarded-Email"]
            }),
            ...(params?.["X-Request-Id"] != null && {
                "X-Request-Id": params["X-Request-Id"]
            }),
            ...(params?.["X-Forwarded-Access-Token"] != null && {
                "X-Forwarded-Access-Token": params["X-Forwarded-Access-Token"]
            }),
            ...options?.headers
        }
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const currentUserKey = (params?: CurrentUserParams)=>{
    return [
        "/api/current-user",
        params
    ] as const;
};
export function useCurrentUser<TData = {
    data: CurrentUserOut;
}>(options?: {
    params?: CurrentUserParams;
    query?: Omit<UseQueryOptions<{
        data: CurrentUserOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: currentUserKey(options?.params),
        queryFn: ()=>currentUser(options?.params),
        ...options?.query
    });
}
export function useCurrentUserSuspense<TData = {
    data: CurrentUserOut;
}>(options?: {
    params?: CurrentUserParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: CurrentUserOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: currentUserKey(options?.params),
        queryFn: ()=>currentUser(options?.params),
        ...options?.query
    });
}
export interface ListProjectsParams {
    q?: string;
    status?: string | null;
    business_dept?: string | null;
    intake_type?: string | null;
    solution_type?: string | null;
}
export const listProjects = async (params?: ListProjectsParams, options?: RequestInit): Promise<{
    data: ProjectListOut;
}> =>{
    const searchParams = new URLSearchParams();
    if (params?.q != null) searchParams.set("q", String(params?.q));
    if (params?.status != null) searchParams.set("status", String(params?.status));
    if (params?.business_dept != null) searchParams.set("business_dept", String(params?.business_dept));
    if (params?.intake_type != null) searchParams.set("intake_type", String(params?.intake_type));
    if (params?.solution_type != null) searchParams.set("solution_type", String(params?.solution_type));
    const queryString = searchParams.toString();
    const url = queryString ? `/api/projects?${queryString}` : "/api/projects";
    const res = await fetch(url, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const listProjectsKey = (params?: ListProjectsParams)=>{
    return [
        "/api/projects",
        params
    ] as const;
};
export function useListProjects<TData = {
    data: ProjectListOut;
}>(options?: {
    params?: ListProjectsParams;
    query?: Omit<UseQueryOptions<{
        data: ProjectListOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: listProjectsKey(options?.params),
        queryFn: ()=>listProjects(options?.params),
        ...options?.query
    });
}
export function useListProjectsSuspense<TData = {
    data: ProjectListOut;
}>(options?: {
    params?: ListProjectsParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: ProjectListOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: listProjectsKey(options?.params),
        queryFn: ()=>listProjects(options?.params),
        ...options?.query
    });
}
export interface CreateProjectParams {
    "X-Forwarded-Host"?: string | null;
    "X-Forwarded-Preferred-Username"?: string | null;
    "X-Forwarded-User"?: string | null;
    "X-Forwarded-Email"?: string | null;
    "X-Request-Id"?: string | null;
    "X-Forwarded-Access-Token"?: string | null;
}
export const createProject = async (data: ProjectIn, params?: CreateProjectParams, options?: RequestInit): Promise<{
    data: ProjectOut;
}> =>{
    const res = await fetch("/api/projects", {
        ...options,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(params?.["X-Forwarded-Host"] != null && {
                "X-Forwarded-Host": params["X-Forwarded-Host"]
            }),
            ...(params?.["X-Forwarded-Preferred-Username"] != null && {
                "X-Forwarded-Preferred-Username": params["X-Forwarded-Preferred-Username"]
            }),
            ...(params?.["X-Forwarded-User"] != null && {
                "X-Forwarded-User": params["X-Forwarded-User"]
            }),
            ...(params?.["X-Forwarded-Email"] != null && {
                "X-Forwarded-Email": params["X-Forwarded-Email"]
            }),
            ...(params?.["X-Request-Id"] != null && {
                "X-Request-Id": params["X-Request-Id"]
            }),
            ...(params?.["X-Forwarded-Access-Token"] != null && {
                "X-Forwarded-Access-Token": params["X-Forwarded-Access-Token"]
            }),
            ...options?.headers
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export function useCreateProject(options?: {
    mutation?: UseMutationOptions<{
        data: ProjectOut;
    }, ApiError, {
        params: CreateProjectParams;
        data: ProjectIn;
    }>;
}) {
    return useMutation({
        mutationFn: (vars)=>createProject(vars.data, vars.params),
        ...options?.mutation
    });
}
export const classifyIntake = async (data: ClassifyIn, options?: RequestInit): Promise<{
    data: ClassifyOut;
}> =>{
    const res = await fetch("/api/projects/classify", {
        ...options,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export function useClassifyIntake(options?: {
    mutation?: UseMutationOptions<{
        data: ClassifyOut;
    }, ApiError, ClassifyIn>;
}) {
    return useMutation({
        mutationFn: (data)=>classifyIntake(data),
        ...options?.mutation
    });
}
export const listDuplicateClusters = async (options?: RequestInit): Promise<{
    data: DuplicateClusterOut[];
}> =>{
    const res = await fetch("/api/projects/duplicate-clusters", {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const listDuplicateClustersKey = ()=>{
    return [
        "/api/projects/duplicate-clusters"
    ] as const;
};
export function useListDuplicateClusters<TData = {
    data: DuplicateClusterOut[];
}>(options?: {
    query?: Omit<UseQueryOptions<{
        data: DuplicateClusterOut[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: listDuplicateClustersKey(),
        queryFn: ()=>listDuplicateClusters(),
        ...options?.query
    });
}
export function useListDuplicateClustersSuspense<TData = {
    data: DuplicateClusterOut[];
}>(options?: {
    query?: Omit<UseSuspenseQueryOptions<{
        data: DuplicateClusterOut[];
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: listDuplicateClustersKey(),
        queryFn: ()=>listDuplicateClusters(),
        ...options?.query
    });
}
export const scanDuplicates = async (data: DuplicateScanIn, options?: RequestInit): Promise<{
    data: DuplicateScanOut;
}> =>{
    const res = await fetch("/api/projects/scan-duplicates", {
        ...options,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...options?.headers
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export function useScanDuplicates(options?: {
    mutation?: UseMutationOptions<{
        data: DuplicateScanOut;
    }, ApiError, DuplicateScanIn>;
}) {
    return useMutation({
        mutationFn: (data)=>scanDuplicates(data),
        ...options?.mutation
    });
}
export interface GetProjectParams {
    project_id: string;
}
export const getProject = async (params: GetProjectParams, options?: RequestInit): Promise<{
    data: ProjectOut;
}> =>{
    const res = await fetch(`/api/projects/${params.project_id}`, {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const getProjectKey = (params?: GetProjectParams)=>{
    return [
        "/api/projects/{project_id}",
        params
    ] as const;
};
export function useGetProject<TData = {
    data: ProjectOut;
}>(options: {
    params: GetProjectParams;
    query?: Omit<UseQueryOptions<{
        data: ProjectOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: getProjectKey(options.params),
        queryFn: ()=>getProject(options.params),
        ...options?.query
    });
}
export function useGetProjectSuspense<TData = {
    data: ProjectOut;
}>(options: {
    params: GetProjectParams;
    query?: Omit<UseSuspenseQueryOptions<{
        data: ProjectOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: getProjectKey(options.params),
        queryFn: ()=>getProject(options.params),
        ...options?.query
    });
}
export interface UpdateProjectParams {
    project_id: string;
    "X-Forwarded-Host"?: string | null;
    "X-Forwarded-Preferred-Username"?: string | null;
    "X-Forwarded-User"?: string | null;
    "X-Forwarded-Email"?: string | null;
    "X-Request-Id"?: string | null;
    "X-Forwarded-Access-Token"?: string | null;
}
export const updateProject = async (params: UpdateProjectParams, data: ProjectUpdate, options?: RequestInit): Promise<{
    data: ProjectOut;
}> =>{
    const res = await fetch(`/api/projects/${params.project_id}`, {
        ...options,
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            ...(params?.["X-Forwarded-Host"] != null && {
                "X-Forwarded-Host": params["X-Forwarded-Host"]
            }),
            ...(params?.["X-Forwarded-Preferred-Username"] != null && {
                "X-Forwarded-Preferred-Username": params["X-Forwarded-Preferred-Username"]
            }),
            ...(params?.["X-Forwarded-User"] != null && {
                "X-Forwarded-User": params["X-Forwarded-User"]
            }),
            ...(params?.["X-Forwarded-Email"] != null && {
                "X-Forwarded-Email": params["X-Forwarded-Email"]
            }),
            ...(params?.["X-Request-Id"] != null && {
                "X-Request-Id": params["X-Request-Id"]
            }),
            ...(params?.["X-Forwarded-Access-Token"] != null && {
                "X-Forwarded-Access-Token": params["X-Forwarded-Access-Token"]
            }),
            ...options?.headers
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export function useUpdateProject(options?: {
    mutation?: UseMutationOptions<{
        data: ProjectOut;
    }, ApiError, {
        params: UpdateProjectParams;
        data: ProjectUpdate;
    }>;
}) {
    return useMutation({
        mutationFn: (vars)=>updateProject(vars.params, vars.data),
        ...options?.mutation
    });
}
export const version = async (options?: RequestInit): Promise<{
    data: VersionOut;
}> =>{
    const res = await fetch("/api/version", {
        ...options,
        method: "GET"
    });
    if (!res.ok) {
        const body = await res.text();
        let parsed: unknown;
        try {
            parsed = JSON.parse(body);
        } catch  {
            parsed = body;
        }
        throw new ApiError(res.status, res.statusText, parsed);
    }
    return {
        data: await res.json()
    };
};
export const versionKey = ()=>{
    return [
        "/api/version"
    ] as const;
};
export function useVersion<TData = {
    data: VersionOut;
}>(options?: {
    query?: Omit<UseQueryOptions<{
        data: VersionOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useQuery({
        queryKey: versionKey(),
        queryFn: ()=>version(),
        ...options?.query
    });
}
export function useVersionSuspense<TData = {
    data: VersionOut;
}>(options?: {
    query?: Omit<UseSuspenseQueryOptions<{
        data: VersionOut;
    }, ApiError, TData>, "queryKey" | "queryFn">;
}) {
    return useSuspenseQuery({
        queryKey: versionKey(),
        queryFn: ()=>version(),
        ...options?.query
    });
}
