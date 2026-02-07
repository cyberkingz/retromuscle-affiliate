import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreatorRepository } from "@/application/repositories/creator-repository";
import {
  type ApplicationStatus,
  MIX_NAMES,
  VIDEO_TYPES,
  type Creator,
  type CreatorApplication,
  type CreatorContractSignature,
  type CreatorPayoutProfile,
  type CreatorStatus,
  type MixDefinition,
  type MixName,
  type MonthlyTracking,
  type PackageDefinition,
  type PackageTier,
  type PaymentStatus,
  type RushAsset,
  type VideoAsset,
  type VideoRate,
  type VideoStatus,
  type VideoType,
  type VideoTypeCount
} from "@/domain/types";

interface CreatorRow {
  id: string;
  user_id: string | null;
  handle: string;
  display_name: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  followers: number;
  social_links: Record<string, unknown> | null;
  package_tier: number;
  default_mix: string;
  status: string;
  start_date: string;
  contract_signed_at: string | null;
  notes: string | null;
}

interface MonthlyTrackingRow {
  id: string;
  month: string;
  creator_id: string;
  package_tier: number;
  quota_total: number;
  mix_name: string;
  quotas: Record<string, unknown>;
  delivered: Record<string, unknown>;
  deadline: string;
  payment_status: string;
  paid_at: string | null;
}

interface VideoRow {
  id: string;
  monthly_tracking_id: string;
  creator_id: string;
  video_type: string;
  file_url: string;
  duration_seconds: number;
  resolution: "1080x1920" | "1080x1080";
  file_size_mb: number;
  status: string;
  rejection_reason: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  created_at: string;
}

interface RushRow {
  id: string;
  monthly_tracking_id: string;
  creator_id: string;
  file_name: string;
  file_size_mb: number;
  file_url?: string | null;
  created_at: string;
}

interface PackageDefinitionRow {
  tier: number;
  quota_videos: number;
  monthly_credits: number | string;
}

interface MixDefinitionRow {
  name: string;
  distribution: Record<string, unknown>;
  positioning: string | null;
}

interface VideoRateRow {
  video_type: string;
  rate_per_video: number | string;
  is_placeholder: boolean | null;
}

interface CreatorApplicationRow {
  id: string;
  user_id: string;
  status: string;
  handle: string;
  full_name: string;
  email: string;
  whatsapp: string;
  country: string;
  address: string;
  social_tiktok: string | null;
  social_instagram: string | null;
  followers: number;
  portfolio_url: string | null;
  package_tier: number;
  mix_name: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CreatorPayoutProfileRow {
  creator_id: string;
  method: string;
  account_holder_name: string | null;
  iban: string | null;
  paypal_email: string | null;
  stripe_account: string | null;
  created_at: string;
  updated_at: string;
}

interface ContractSignatureRow {
  id: string;
  creator_id: string;
  user_id: string;
  contract_version: string;
  contract_checksum: string;
  signer_name: string;
  acceptance: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
  signed_at: string;
  created_at: string;
}

function toVideoType(value: string): VideoType {
  const normalized = value.toUpperCase();
  if (!VIDEO_TYPES.includes(normalized as VideoType)) {
    throw new Error(`Unknown video type from database: ${value}`);
  }
  return normalized as VideoType;
}

function toMixName(value: string): MixName {
  const normalized = value.toUpperCase();
  if (!MIX_NAMES.includes(normalized as MixName)) {
    throw new Error(`Unknown mix name from database: ${value}`);
  }
  return normalized as MixName;
}

function toCreatorStatus(value: string): CreatorStatus {
  const allowed: CreatorStatus[] = ["candidat", "actif", "pause", "inactif"];
  if (!allowed.includes(value as CreatorStatus)) {
    throw new Error(`Unknown creator status from database: ${value}`);
  }
  return value as CreatorStatus;
}

function toPaymentStatus(value: string): PaymentStatus {
  const allowed: PaymentStatus[] = ["a_faire", "en_cours", "paye"];
  if (!allowed.includes(value as PaymentStatus)) {
    throw new Error(`Unknown payment status from database: ${value}`);
  }
  return value as PaymentStatus;
}

function toVideoStatus(value: string): VideoStatus {
  const allowed: VideoStatus[] = ["uploaded", "pending_review", "approved", "rejected"];
  if (!allowed.includes(value as VideoStatus)) {
    throw new Error(`Unknown video status from database: ${value}`);
  }
  return value as VideoStatus;
}

function toApplicationStatus(value: string): ApplicationStatus {
  const allowed: ApplicationStatus[] = ["draft", "pending_review", "approved", "rejected"];
  if (!allowed.includes(value as ApplicationStatus)) {
    throw new Error(`Unknown application status from database: ${value}`);
  }
  return value as ApplicationStatus;
}

function toPayoutMethod(value: string): CreatorPayoutProfile["method"] {
  const allowed: CreatorPayoutProfile["method"][] = ["iban", "paypal", "stripe"];
  if (!allowed.includes(value as CreatorPayoutProfile["method"])) {
    throw new Error(`Unknown payout method from database: ${value}`);
  }
  return value as CreatorPayoutProfile["method"];
}

function toVideoTypeCount(raw: Record<string, unknown> | null | undefined): VideoTypeCount {
  const input = raw ?? {};

  return VIDEO_TYPES.reduce((acc, type) => {
    const value = input[type];
    const parsed = typeof value === "number" ? value : Number(value ?? 0);
    acc[type] = Number.isFinite(parsed) ? parsed : 0;
    return acc;
  }, {} as VideoTypeCount);
}

function mapCreator(row: CreatorRow): Creator {
  const socialLinks = row.social_links ?? {};

  return {
    id: row.id,
    handle: row.handle,
    displayName: row.display_name,
    email: row.email,
    whatsapp: row.whatsapp,
    country: row.country,
    address: row.address,
    followers: row.followers,
    socialLinks: {
      tiktok: typeof socialLinks.tiktok === "string" ? socialLinks.tiktok : undefined,
      instagram: typeof socialLinks.instagram === "string" ? socialLinks.instagram : undefined
    },
    packageTier: row.package_tier as 10 | 20 | 30 | 40,
    defaultMix: toMixName(row.default_mix),
    status: toCreatorStatus(row.status),
    startDate: row.start_date,
    contractSignedAt: row.contract_signed_at ?? undefined,
    notes: row.notes ?? undefined
  };
}

function mapMonthlyTracking(row: MonthlyTrackingRow): MonthlyTracking {
  return {
    id: row.id,
    month: row.month,
    creatorId: row.creator_id,
    packageTier: row.package_tier as 10 | 20 | 30 | 40,
    quotaTotal: row.quota_total,
    mixName: toMixName(row.mix_name),
    quotas: toVideoTypeCount(row.quotas),
    delivered: toVideoTypeCount(row.delivered),
    deadline: row.deadline,
    paymentStatus: toPaymentStatus(row.payment_status),
    paidAt: row.paid_at ?? undefined
  };
}

function mapVideo(row: VideoRow): VideoAsset {
  return {
    id: row.id,
    monthlyTrackingId: row.monthly_tracking_id,
    creatorId: row.creator_id,
    videoType: toVideoType(row.video_type),
    fileUrl: row.file_url,
    durationSeconds: row.duration_seconds,
    resolution: row.resolution,
    fileSizeMb: row.file_size_mb,
    status: toVideoStatus(row.status),
    rejectionReason: row.rejection_reason ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    createdAt: row.created_at
  };
}

function mapRush(row: RushRow): RushAsset {
  return {
    id: row.id,
    monthlyTrackingId: row.monthly_tracking_id,
    creatorId: row.creator_id,
    fileName: row.file_name,
    fileSizeMb: row.file_size_mb,
    fileUrl: row.file_url ?? undefined,
    createdAt: row.created_at
  };
}

function mapCreatorApplication(row: CreatorApplicationRow): CreatorApplication {
  return {
    id: row.id,
    userId: row.user_id,
    status: toApplicationStatus(row.status),
    handle: row.handle,
    fullName: row.full_name,
    email: row.email,
    whatsapp: row.whatsapp,
    country: row.country,
    address: row.address,
    socialTiktok: row.social_tiktok ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    followers: row.followers,
    portfolioUrl: row.portfolio_url ?? undefined,
    packageTier: row.package_tier as PackageTier,
    mixName: toMixName(row.mix_name),
    submittedAt: row.submitted_at ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewNotes: row.review_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapPayoutProfile(row: CreatorPayoutProfileRow): CreatorPayoutProfile {
  return {
    creatorId: row.creator_id,
    method: toPayoutMethod(row.method),
    accountHolderName: row.account_holder_name,
    iban: row.iban,
    paypalEmail: row.paypal_email,
    stripeAccount: row.stripe_account,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapContractSignature(row: ContractSignatureRow): CreatorContractSignature {
  const acceptance: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(row.acceptance ?? {})) {
    if (typeof value === "boolean") {
      acceptance[key] = value;
    }
  }

  return {
    id: row.id,
    creatorId: row.creator_id,
    userId: row.user_id,
    contractVersion: row.contract_version,
    contractChecksum: row.contract_checksum,
    signerName: row.signer_name,
    acceptance,
    ip: row.ip,
    userAgent: row.user_agent,
    signedAt: row.signed_at,
    createdAt: row.created_at
  };
}

export class SupabaseCreatorRepository implements CreatorRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCreators(): Promise<Creator[]> {
    const { data, error } = await this.client
      .from("creators")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list creators: ${error.message}`);
    }

    return (data as CreatorRow[]).map(mapCreator);
  }

  async getCreatorById(creatorId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select("*")
      .eq("id", creatorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator ${creatorId}: ${error.message}`);
    }

    return data ? mapCreator(data as CreatorRow) : null;
  }

  async listMonthlyTrackings(month?: string): Promise<MonthlyTracking[]> {
    let query = this.client.from("monthly_tracking").select("*").order("month", { ascending: false });

    if (month) {
      query = query.eq("month", month);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list monthly tracking: ${error.message}`);
    }

    return (data as MonthlyTrackingRow[]).map(mapMonthlyTracking);
  }

  async getMonthlyTracking(creatorId: string, month: string): Promise<MonthlyTracking | null> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .select("*")
      .eq("creator_id", creatorId)
      .eq("month", month)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get monthly tracking for ${creatorId}/${month}: ${error.message}`);
    }

    return data ? mapMonthlyTracking(data as MonthlyTrackingRow) : null;
  }

  async getMonthlyTrackingById(monthlyTrackingId: string): Promise<MonthlyTracking | null> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .select("*")
      .eq("id", monthlyTrackingId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get monthly tracking ${monthlyTrackingId}: ${error.message}`);
    }

    return data ? mapMonthlyTracking(data as MonthlyTrackingRow) : null;
  }

  async listCreatorTrackings(creatorId: string): Promise<MonthlyTracking[]> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .select("*")
      .eq("creator_id", creatorId)
      .order("month", { ascending: false });

    if (error) {
      throw new Error(`Failed to list creator trackings for ${creatorId}: ${error.message}`);
    }

    return (data as MonthlyTrackingRow[]).map(mapMonthlyTracking);
  }

  async listVideosByStatus(status: VideoStatus): Promise<VideoAsset[]> {
    const { data, error } = await this.client
      .from("videos")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list videos by status ${status}: ${error.message}`);
    }

    return (data as VideoRow[]).map(mapVideo);
  }

  async listVideosByTracking(monthlyTrackingId: string): Promise<VideoAsset[]> {
    const { data, error } = await this.client
      .from("videos")
      .select("*")
      .eq("monthly_tracking_id", monthlyTrackingId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list videos by tracking ${monthlyTrackingId}: ${error.message}`);
    }

    return (data as VideoRow[]).map(mapVideo);
  }

  async listRushesByTracking(monthlyTrackingId: string): Promise<RushAsset[]> {
    const { data, error } = await this.client
      .from("rushes")
      .select("*")
      .eq("monthly_tracking_id", monthlyTrackingId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list rushes by tracking ${monthlyTrackingId}: ${error.message}`);
    }

    return (data as RushRow[]).map(mapRush);
  }

  async createRushAsset(input: {
    monthlyTrackingId: string;
    creatorId: string;
    fileName: string;
    fileSizeMb: number;
    fileUrl?: string | null;
  }): Promise<RushAsset> {
    const { data, error } = await this.client
      .from("rushes")
      .insert({
        monthly_tracking_id: input.monthlyTrackingId,
        creator_id: input.creatorId,
        file_name: input.fileName,
        file_size_mb: input.fileSizeMb,
        file_url: input.fileUrl ?? null
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create rush asset: ${error.message}`);
    }

    return mapRush(data as RushRow);
  }

  async createVideoAsset(input: {
    monthlyTrackingId: string;
    creatorId: string;
    videoType: VideoAsset["videoType"];
    fileUrl: string;
    durationSeconds: number;
    resolution: VideoAsset["resolution"];
    fileSizeMb: number;
    status?: VideoStatus;
  }): Promise<VideoAsset> {
    const { data, error } = await this.client
      .from("videos")
      .insert({
        monthly_tracking_id: input.monthlyTrackingId,
        creator_id: input.creatorId,
        video_type: input.videoType,
        file_url: input.fileUrl,
        duration_seconds: input.durationSeconds,
        resolution: input.resolution,
        file_size_mb: input.fileSizeMb,
        status: input.status ?? "pending_review"
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create video asset: ${error.message}`);
    }

    return mapVideo(data as VideoRow);
  }

  async reviewVideoAsset(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<VideoAsset> {
    const { data, error } = await this.client
      .from("videos")
      .update({
        status: input.status,
        rejection_reason: input.status === "rejected" ? input.rejectionReason ?? null : null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: input.reviewedBy
      })
      .eq("id", input.videoId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to review video ${input.videoId}: ${error?.message ?? "missing row"}`);
    }

    return mapVideo(data as VideoRow);
  }

  async updateTrackingDelivered(input: {
    monthlyTrackingId: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .update({
        delivered: input.delivered
      })
      .eq("id", input.monthlyTrackingId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to update tracking delivered for ${input.monthlyTrackingId}: ${error?.message ?? "missing row"}`);
    }

    return mapMonthlyTracking(data as MonthlyTrackingRow);
  }

  async markMonthlyTrackingPaid(input: {
    monthlyTrackingId: string;
    paidAt?: string | null;
  }): Promise<MonthlyTracking> {
    const paidAt = input.paidAt ?? new Date().toISOString();

    const { data, error } = await this.client
      .from("monthly_tracking")
      .update({
        payment_status: "paye",
        paid_at: paidAt
      })
      .eq("id", input.monthlyTrackingId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(
        `Failed to mark tracking paid for ${input.monthlyTrackingId}: ${error?.message ?? "missing row"}`
      );
    }

    return mapMonthlyTracking(data as MonthlyTrackingRow);
  }

  async getPayoutProfileByCreatorId(creatorId: string): Promise<CreatorPayoutProfile | null> {
    const { data, error } = await this.client
      .from("creator_payout_profiles")
      .select("*")
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get payout profile for ${creatorId}: ${error.message}`);
    }

    return data ? mapPayoutProfile(data as CreatorPayoutProfileRow) : null;
  }

  async upsertPayoutProfile(input: {
    creatorId: string;
    method: CreatorPayoutProfile["method"];
    accountHolderName?: string | null;
    iban?: string | null;
    paypalEmail?: string | null;
    stripeAccount?: string | null;
  }): Promise<CreatorPayoutProfile> {
    const { data, error } = await this.client
      .from("creator_payout_profiles")
      .upsert(
        {
          creator_id: input.creatorId,
          method: input.method,
          account_holder_name: input.accountHolderName ?? null,
          iban: input.iban ?? null,
          paypal_email: input.paypalEmail ?? null,
          stripe_account: input.stripeAccount ?? null
        },
        { onConflict: "creator_id" }
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to upsert payout profile for ${input.creatorId}: ${error.message}`);
    }

    return mapPayoutProfile(data as CreatorPayoutProfileRow);
  }

  async listContractSignaturesByCreatorId(creatorId: string): Promise<CreatorContractSignature[]> {
    const { data, error } = await this.client
      .from("creator_contract_signatures")
      .select("id,creator_id,user_id,contract_version,contract_checksum,signer_name,acceptance,ip,user_agent,signed_at,created_at")
      .eq("creator_id", creatorId)
      .order("signed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list contract signatures for ${creatorId}: ${error.message}`);
    }

    return (data as ContractSignatureRow[]).map(mapContractSignature);
  }

  async listRates(): Promise<VideoRate[]> {
    const { data, error } = await this.client
      .from("video_rates")
      .select("*")
      .order("video_type", { ascending: true });

    if (error) {
      throw new Error(`Failed to list video rates: ${error.message}`);
    }

    return (data as VideoRateRow[]).map((row) => ({
      videoType: toVideoType(row.video_type),
      ratePerVideo: Number(row.rate_per_video),
      isPlaceholder: row.is_placeholder ?? false
    }));
  }

  async listPackageDefinitions(): Promise<PackageDefinition[]> {
    const { data, error } = await this.client
      .from("package_definitions")
      .select("*")
      .order("tier", { ascending: true });

    if (error) {
      throw new Error(`Failed to list package definitions: ${error.message}`);
    }

    return (data as PackageDefinitionRow[]).map((row) => ({
      tier: row.tier as 10 | 20 | 30 | 40,
      quotaVideos: row.quota_videos,
      monthlyCredits: Number(row.monthly_credits)
    }));
  }

  async listMixDefinitions(): Promise<MixDefinition[]> {
    const { data, error } = await this.client
      .from("mix_definitions")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to list mix definitions: ${error.message}`);
    }

    return (data as MixDefinitionRow[]).map((row) => ({
      name: toMixName(row.name),
      distribution: toVideoTypeCount(row.distribution),
      positioning: row.positioning ?? ""
    }));
  }

  async listCreatorApplications(status?: ApplicationStatus): Promise<CreatorApplication[]> {
    let query = this.client
      .from("creator_applications")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list creator applications: ${error.message}`);
    }

    return (data as CreatorApplicationRow[]).map(mapCreatorApplication);
  }

  async getCreatorApplicationByUserId(userId: string): Promise<CreatorApplication | null> {
    const { data, error } = await this.client
      .from("creator_applications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator application for ${userId}: ${error.message}`);
    }

    return data ? mapCreatorApplication(data as CreatorApplicationRow) : null;
  }

  async reviewCreatorApplication(input: {
    userId: string;
    status: Exclude<ApplicationStatus, "draft" | "pending_review">;
    reviewNotes?: string | null;
  }): Promise<CreatorApplication> {
    const { data, error } = await this.client
      .from("creator_applications")
      .update({
        status: input.status,
        reviewed_at: new Date().toISOString(),
        review_notes: input.reviewNotes ?? null
      })
      .eq("user_id", input.userId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to review creator application for ${input.userId}: ${error?.message ?? "missing row"}`);
    }

    return mapCreatorApplication(data as CreatorApplicationRow);
  }

  async getCreatorByUserId(userId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator by user_id ${userId}: ${error.message}`);
    }

    return data ? mapCreator(data as CreatorRow) : null;
  }

  async upsertCreatorFromApplication(input: {
    application: CreatorApplication;
    status: "actif" | "candidat";
    startDate: string;
  }): Promise<Creator> {
    const normalizedEmail = input.application.email.trim().toLowerCase();

    const creatorPayload = {
      user_id: input.application.userId,
      handle: input.application.handle,
      display_name: input.application.fullName,
      email: normalizedEmail,
      whatsapp: input.application.whatsapp,
      country: input.application.country,
      address: input.application.address,
      followers: input.application.followers,
      social_links: {
        ...(input.application.socialTiktok ? { tiktok: input.application.socialTiktok } : {}),
        ...(input.application.socialInstagram ? { instagram: input.application.socialInstagram } : {}),
        ...(input.application.portfolioUrl ? { portfolio: input.application.portfolioUrl } : {})
      },
      package_tier: input.application.packageTier,
      default_mix: input.application.mixName,
      status: input.status,
      start_date: input.startDate
    };

    const { data: existingByUserId, error: byUserIdError } = await this.client
      .from("creators")
      .select("*")
      .eq("user_id", input.application.userId)
      .maybeSingle();

    if (byUserIdError) {
      throw new Error(`Failed to resolve creator mapping: ${byUserIdError.message}`);
    }

    if (existingByUserId) {
      const { data: updated, error: updateError } = await this.client
        .from("creators")
        .update({
          handle: creatorPayload.handle,
          display_name: creatorPayload.display_name,
          email: creatorPayload.email,
          whatsapp: creatorPayload.whatsapp,
          country: creatorPayload.country,
          address: creatorPayload.address,
          followers: creatorPayload.followers,
          social_links: creatorPayload.social_links,
          package_tier: creatorPayload.package_tier,
          default_mix: creatorPayload.default_mix,
          status: creatorPayload.status
        })
        .eq("id", (existingByUserId as CreatorRow).id)
        .select("*")
        .maybeSingle();

      if (updateError || !updated) {
        throw new Error(`Failed to update creator from application: ${updateError?.message ?? "missing row"}`);
      }

      return mapCreator(updated as CreatorRow);
    }

    const { data: existingByEmail, error: byEmailError } = await this.client
      .from("creators")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (byEmailError) {
      throw new Error(`Failed to resolve creator email mapping: ${byEmailError.message}`);
    }

    if (existingByEmail) {
      const { data: updated, error: updateError } = await this.client
        .from("creators")
        .update({
          ...creatorPayload
        })
        .eq("id", (existingByEmail as CreatorRow).id)
        .select("*")
        .maybeSingle();

      if (updateError || !updated) {
        throw new Error(`Failed to attach creator to user: ${updateError?.message ?? "missing row"}`);
      }

      return mapCreator(updated as CreatorRow);
    }

    const { data, error } = await this.client
      .from("creators")
      .insert(creatorPayload)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create creator from application: ${error.message}`);
    }

    return mapCreator(data as CreatorRow);
  }

  async createMonthlyTracking(input: {
    creatorId: string;
    month: string;
    packageTier: PackageTier;
    quotaTotal: number;
    mixName: CreatorApplication["mixName"];
    quotas: MonthlyTracking["quotas"];
    delivered: MonthlyTracking["delivered"];
    deadline: string;
  }): Promise<MonthlyTracking> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .upsert(
        {
          month: input.month,
          creator_id: input.creatorId,
          package_tier: input.packageTier,
          quota_total: input.quotaTotal,
          mix_name: input.mixName,
          quotas: input.quotas,
          delivered: input.delivered,
          deadline: input.deadline,
          payment_status: "en_cours"
        },
        { onConflict: "month,creator_id" }
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create monthly tracking: ${error.message}`);
    }

    return mapMonthlyTracking(data as MonthlyTrackingRow);
  }
}
