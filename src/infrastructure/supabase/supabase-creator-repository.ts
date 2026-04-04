import type { SupabaseClient } from "@supabase/supabase-js";

import type { CreatorRepository } from "@/application/repositories/creator-repository";
import {
  type ApplicationStatus,
  VIDEO_TYPES,
  type Creator,
  type CreatorApplication,
  type CreatorContractSignature,
  type CreatorPayoutProfile,
  type CreatorStatus,
  type MonthlyTracking,
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
  followers_tiktok: number;
  followers_instagram: number;
  social_links: Record<string, unknown> | null;
  status: string;
  start_date: string;
  contract_signed_at: string | null;
  notes: string | null;
}

interface MonthlyTrackingRow {
  id: string;
  month: string;
  creator_id: string;
  delivered: Record<string, unknown>;
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
  followers_tiktok: number;
  followers_instagram: number;
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
    followersTiktok: row.followers_tiktok,
    followersInstagram: row.followers_instagram,
    socialLinks: {
      tiktok: typeof socialLinks.tiktok === "string" ? socialLinks.tiktok : undefined,
      instagram: typeof socialLinks.instagram === "string" ? socialLinks.instagram : undefined
    },
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
    delivered: toVideoTypeCount(row.delivered),
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
    followersTiktok: row.followers_tiktok,
    followersInstagram: row.followers_instagram,
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

// Explicit column selections to avoid select("*") over-fetching (H-03).
const CREATOR_COLS = "id,user_id,handle,display_name,email,whatsapp,country,address,followers_tiktok,followers_instagram,social_links,status,start_date,contract_signed_at,notes" as const;
const TRACKING_COLS = "id,month,creator_id,delivered,payment_status,paid_at" as const;
const VIDEO_COLS = "id,monthly_tracking_id,creator_id,video_type,file_url,duration_seconds,resolution,file_size_mb,status,rejection_reason,reviewed_at,reviewed_by,created_at" as const;
const RUSH_COLS = "id,monthly_tracking_id,creator_id,file_name,file_size_mb,file_url,created_at" as const;
const RATE_COLS = "video_type,rate_per_video,is_placeholder" as const;
const APPLICATION_COLS = "id,user_id,status,handle,full_name,email,whatsapp,country,address,social_tiktok,social_instagram,followers_tiktok,followers_instagram,submitted_at,reviewed_at,review_notes,created_at,updated_at" as const;
const PAYOUT_COLS = "creator_id,method,account_holder_name,iban,paypal_email,stripe_account,created_at,updated_at" as const;

/** Safety limit for unbounded list queries to prevent OOM at scale (H-04). */
const LIST_LIMIT = 1000;

export class SupabaseCreatorRepository implements CreatorRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listCreators(): Promise<Creator[]> {
    const { data, error } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .order("created_at", { ascending: true })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list creators: ${error.message}`);
    }

    return (data as CreatorRow[]).map(mapCreator);
  }

  async getCreatorById(creatorId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
      .eq("id", creatorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get creator ${creatorId}: ${error.message}`);
    }

    return data ? mapCreator(data as CreatorRow) : null;
  }

  async listMonthlyTrackings(month?: string): Promise<MonthlyTracking[]> {
    let query = this.client.from("monthly_tracking").select(TRACKING_COLS).order("month", { ascending: false }).limit(LIST_LIMIT);

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
      .select(TRACKING_COLS)
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
      .select(TRACKING_COLS)
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
      .select(TRACKING_COLS)
      .eq("creator_id", creatorId)
      .order("month", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list creator trackings for ${creatorId}: ${error.message}`);
    }

    return (data as MonthlyTrackingRow[]).map(mapMonthlyTracking);
  }

  async listVideosByStatus(status: VideoStatus): Promise<VideoAsset[]> {
    const { data, error } = await this.client
      .from("videos")
      .select(VIDEO_COLS)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list videos by status ${status}: ${error.message}`);
    }

    return (data as VideoRow[]).map(mapVideo);
  }

  async listVideosByTracking(monthlyTrackingId: string): Promise<VideoAsset[]> {
    const { data, error } = await this.client
      .from("videos")
      .select(VIDEO_COLS)
      .eq("monthly_tracking_id", monthlyTrackingId)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list videos by tracking ${monthlyTrackingId}: ${error.message}`);
    }

    return (data as VideoRow[]).map(mapVideo);
  }

  async listRushesByTracking(monthlyTrackingId: string): Promise<RushAsset[]> {
    const { data, error } = await this.client
      .from("rushes")
      .select(RUSH_COLS)
      .eq("monthly_tracking_id", monthlyTrackingId)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

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
      .select(RUSH_COLS)
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
      .select(VIDEO_COLS)
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
      .select(VIDEO_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to review video ${input.videoId}: ${error?.message ?? "missing row"}`);
    }

    return mapVideo(data as VideoRow);
  }

  async reviewVideoAndUpdateTracking(input: {
    videoId: string;
    status: Extract<VideoStatus, "approved" | "rejected">;
    rejectionReason?: string | null;
    reviewedBy: string;
  }): Promise<{ video: VideoAsset; tracking: MonthlyTracking }> {
    const { data, error } = await this.client.rpc("review_video_and_update_tracking", {
      p_video_id: input.videoId,
      p_status: input.status,
      p_rejection_reason: input.status === "rejected" ? input.rejectionReason ?? null : null,
      p_reviewed_by: input.reviewedBy
    });

    if (error) {
      throw new Error(`Failed to review video atomically ${input.videoId}: ${error.message}`);
    }

    const result = data as { video: VideoRow; tracking: MonthlyTrackingRow };
    return {
      video: mapVideo(result.video),
      tracking: mapMonthlyTracking(result.tracking)
    };
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
      .select(TRACKING_COLS)
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
      .select(TRACKING_COLS)
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
      .select(PAYOUT_COLS)
      .eq("creator_id", creatorId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get payout profile for ${creatorId}: ${error.message}`);
    }

    return data ? mapPayoutProfile(data as CreatorPayoutProfileRow) : null;
  }

  async listPayoutProfiles(): Promise<CreatorPayoutProfile[]> {
    const { data, error } = await this.client
      .from("creator_payout_profiles")
      .select(PAYOUT_COLS)
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list payout profiles: ${error.message}`);
    }

    return (data as CreatorPayoutProfileRow[]).map(mapPayoutProfile);
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
      .select(PAYOUT_COLS)
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
      .order("signed_at", { ascending: false })
      .limit(LIST_LIMIT);

    if (error) {
      throw new Error(`Failed to list contract signatures for ${creatorId}: ${error.message}`);
    }

    return (data as ContractSignatureRow[]).map(mapContractSignature);
  }

  async listRates(): Promise<VideoRate[]> {
    const { data, error } = await this.client
      .from("video_rates")
      .select(RATE_COLS)
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

  async updateVideoRate(input: {
    videoType: VideoType;
    ratePerVideo: number;
  }): Promise<VideoRate> {
    const { data, error } = await this.client
      .from("video_rates")
      .update({
        rate_per_video: input.ratePerVideo,
        is_placeholder: false
      })
      .eq("video_type", input.videoType)
      .select(RATE_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to update video rate ${input.videoType}: ${error.message}`);
    }

    const row = data as VideoRateRow;
    return {
      videoType: toVideoType(row.video_type),
      ratePerVideo: Number(row.rate_per_video),
      isPlaceholder: row.is_placeholder ?? false
    };
  }

  async listCreatorApplications(status?: ApplicationStatus): Promise<CreatorApplication[]> {
    let query = this.client
      .from("creator_applications")
      .select(APPLICATION_COLS)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT);

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
      .select(APPLICATION_COLS)
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
      .select(APPLICATION_COLS)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to review creator application for ${input.userId}: ${error?.message ?? "missing row"}`);
    }

    return mapCreatorApplication(data as CreatorApplicationRow);
  }

  async getCreatorByUserId(userId: string): Promise<Creator | null> {
    const { data, error } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
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
      followers_tiktok: input.application.followersTiktok,
      followers_instagram: input.application.followersInstagram,
      social_links: {
        ...(input.application.socialTiktok ? { tiktok: input.application.socialTiktok } : {}),
        ...(input.application.socialInstagram ? { instagram: input.application.socialInstagram } : {})
      },
      status: input.status,
      start_date: input.startDate
    };

    const { data: existingByUserId, error: byUserIdError } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
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
          followers_tiktok: creatorPayload.followers_tiktok,
          followers_instagram: creatorPayload.followers_instagram,
          social_links: creatorPayload.social_links,
          status: creatorPayload.status
        })
        .eq("id", (existingByUserId as CreatorRow).id)
        .select(CREATOR_COLS)
        .maybeSingle();

      if (updateError || !updated) {
        throw new Error(`Failed to update creator from application: ${updateError?.message ?? "missing row"}`);
      }

      return mapCreator(updated as CreatorRow);
    }

    const { data: existingByEmail, error: byEmailError } = await this.client
      .from("creators")
      .select(CREATOR_COLS)
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
        .select(CREATOR_COLS)
        .maybeSingle();

      if (updateError || !updated) {
        throw new Error(`Failed to attach creator to user: ${updateError?.message ?? "missing row"}`);
      }

      return mapCreator(updated as CreatorRow);
    }

    const { data, error } = await this.client
      .from("creators")
      .insert(creatorPayload)
      .select(CREATOR_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to create creator from application: ${error.message}`);
    }

    return mapCreator(data as CreatorRow);
  }

  async createMonthlyTracking(input: {
    creatorId: string;
    month: string;
    delivered: MonthlyTracking["delivered"];
  }): Promise<MonthlyTracking> {
    const { data, error } = await this.client
      .from("monthly_tracking")
      .upsert(
        {
          month: input.month,
          creator_id: input.creatorId,
          delivered: input.delivered,
          payment_status: "en_cours"
        },
        { onConflict: "month,creator_id" }
      )
      .select(TRACKING_COLS)
      .single();

    if (error) {
      throw new Error(`Failed to create monthly tracking: ${error.message}`);
    }

    return mapMonthlyTracking(data as MonthlyTrackingRow);
  }
}
