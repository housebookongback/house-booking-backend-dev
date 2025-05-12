--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_BookingCancellations_cancelledBy; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_BookingCancellations_cancelledBy" AS ENUM (
    'guest',
    'host',
    'system'
);


ALTER TYPE public."enum_BookingCancellations_cancelledBy" OWNER TO postgres;

--
-- Name: enum_BookingCancellations_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_BookingCancellations_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."enum_BookingCancellations_status" OWNER TO postgres;

--
-- Name: enum_BookingChanges_changeType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_BookingChanges_changeType" AS ENUM (
    'dates',
    'guests',
    'price',
    'other'
);


ALTER TYPE public."enum_BookingChanges_changeType" OWNER TO postgres;

--
-- Name: enum_BookingChanges_requestedBy; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_BookingChanges_requestedBy" AS ENUM (
    'guest',
    'host',
    'system'
);


ALTER TYPE public."enum_BookingChanges_requestedBy" OWNER TO postgres;

--
-- Name: enum_BookingChanges_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_BookingChanges_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."enum_BookingChanges_status" OWNER TO postgres;

--
-- Name: enum_BookingRequests_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_BookingRequests_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE public."enum_BookingRequests_status" OWNER TO postgres;

--
-- Name: enum_Bookings_paymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Bookings_paymentStatus" AS ENUM (
    'pending',
    'paid',
    'refunded',
    'failed'
);


ALTER TYPE public."enum_Bookings_paymentStatus" OWNER TO postgres;

--
-- Name: enum_Bookings_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Bookings_status" AS ENUM (
    'pending',
    'confirmed',
    'cancelled',
    'completed'
);


ALTER TYPE public."enum_Bookings_status" OWNER TO postgres;

--
-- Name: enum_ClickCounts_deviceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ClickCounts_deviceType" AS ENUM (
    'desktop',
    'mobile',
    'tablet'
);


ALTER TYPE public."enum_ClickCounts_deviceType" OWNER TO postgres;

--
-- Name: enum_ClickCounts_entityType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ClickCounts_entityType" AS ENUM (
    'listing',
    'user',
    'category',
    'location'
);


ALTER TYPE public."enum_ClickCounts_entityType" OWNER TO postgres;

--
-- Name: enum_ConversationParticipants_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ConversationParticipants_role" AS ENUM (
    'guest',
    'host'
);


ALTER TYPE public."enum_ConversationParticipants_role" OWNER TO postgres;

--
-- Name: enum_Conversations_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Conversations_status" AS ENUM (
    'active',
    'archived',
    'blocked'
);


ALTER TYPE public."enum_Conversations_status" OWNER TO postgres;

--
-- Name: enum_Documents_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Documents_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE public."enum_Documents_status" OWNER TO postgres;

--
-- Name: enum_Documents_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Documents_type" AS ENUM (
    'id_card',
    'passport',
    'driver_license',
    'utility_bill',
    'bank_statement',
    'tax_document',
    'insurance',
    'other'
);


ALTER TYPE public."enum_Documents_type" OWNER TO postgres;

--
-- Name: enum_GuestProfiles_verificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_GuestProfiles_verificationStatus" AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE public."enum_GuestProfiles_verificationStatus" OWNER TO postgres;

--
-- Name: enum_GuestVerifications_documentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_GuestVerifications_documentType" AS ENUM (
    'passport',
    'id_card',
    'drivers_license',
    'other'
);


ALTER TYPE public."enum_GuestVerifications_documentType" OWNER TO postgres;

--
-- Name: enum_GuestVerifications_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_GuestVerifications_status" AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE public."enum_GuestVerifications_status" OWNER TO postgres;

--
-- Name: enum_HostEarnings_paymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_HostEarnings_paymentMethod" AS ENUM (
    'bank_transfer',
    'paypal',
    'stripe',
    'other'
);


ALTER TYPE public."enum_HostEarnings_paymentMethod" OWNER TO postgres;

--
-- Name: enum_HostEarnings_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_HostEarnings_status" AS ENUM (
    'pending',
    'processing',
    'paid',
    'failed',
    'refunded'
);


ALTER TYPE public."enum_HostEarnings_status" OWNER TO postgres;

--
-- Name: enum_HostEarnings_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_HostEarnings_type" AS ENUM (
    'booking',
    'cleaning_fee',
    'security_deposit',
    'damage_fee',
    'late_checkout',
    'extra_guest',
    'other'
);


ALTER TYPE public."enum_HostEarnings_type" OWNER TO postgres;

--
-- Name: enum_HostProfiles_verificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_HostProfiles_verificationStatus" AS ENUM (
    'unverified',
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE public."enum_HostProfiles_verificationStatus" OWNER TO postgres;

--
-- Name: enum_HostVerifications_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_HostVerifications_status" AS ENUM (
    'pending',
    'verified',
    'rejected',
    'expired'
);


ALTER TYPE public."enum_HostVerifications_status" OWNER TO postgres;

--
-- Name: enum_HostVerifications_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_HostVerifications_type" AS ENUM (
    'identity',
    'address',
    'phone',
    'email',
    'payment',
    'government_id',
    'business_registration',
    'tax_document',
    'other'
);


ALTER TYPE public."enum_HostVerifications_type" OWNER TO postgres;

--
-- Name: enum_Listings_cancellationPolicy; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Listings_cancellationPolicy" AS ENUM (
    'flexible',
    'moderate',
    'strict'
);


ALTER TYPE public."enum_Listings_cancellationPolicy" OWNER TO postgres;

--
-- Name: enum_Listings_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Listings_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE public."enum_Listings_status" OWNER TO postgres;

--
-- Name: enum_Maintenances_impact; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Maintenances_impact" AS ENUM (
    'none',
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE public."enum_Maintenances_impact" OWNER TO postgres;

--
-- Name: enum_Maintenances_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Maintenances_status" AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public."enum_Maintenances_status" OWNER TO postgres;

--
-- Name: enum_Maintenances_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Maintenances_type" AS ENUM (
    'system',
    'database',
    'security',
    'feature',
    'other'
);


ALTER TYPE public."enum_Maintenances_type" OWNER TO postgres;

--
-- Name: enum_Notifications_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Notifications_category" AS ENUM (
    'booking',
    'payment',
    'review',
    'message',
    'system'
);


ALTER TYPE public."enum_Notifications_category" OWNER TO postgres;

--
-- Name: enum_Notifications_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Notifications_type" AS ENUM (
    'info',
    'success',
    'warning',
    'error'
);


ALTER TYPE public."enum_Notifications_type" OWNER TO postgres;

--
-- Name: enum_Payments_paymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Payments_paymentMethod" AS ENUM (
    'credit_card',
    'bank_transfer',
    'paypal',
    'stripe'
);


ALTER TYPE public."enum_Payments_paymentMethod" OWNER TO postgres;

--
-- Name: enum_Payments_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Payments_status" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'disputed'
);


ALTER TYPE public."enum_Payments_status" OWNER TO postgres;

--
-- Name: enum_PayoutAccounts_accountType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PayoutAccounts_accountType" AS ENUM (
    'bank_account',
    'paypal',
    'stripe'
);


ALTER TYPE public."enum_PayoutAccounts_accountType" OWNER TO postgres;

--
-- Name: enum_PayoutAccounts_verificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PayoutAccounts_verificationStatus" AS ENUM (
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE public."enum_PayoutAccounts_verificationStatus" OWNER TO postgres;

--
-- Name: enum_Photos_category; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Photos_category" AS ENUM (
    'exterior',
    'interior',
    'bedroom',
    'bathroom',
    'kitchen',
    'living_room',
    'dining_room',
    'garden',
    'pool',
    'view',
    'other'
);


ALTER TYPE public."enum_Photos_category" OWNER TO postgres;

--
-- Name: enum_Photos_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Photos_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."enum_Photos_status" OWNER TO postgres;

--
-- Name: enum_PriceRules_adjustmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PriceRules_adjustmentType" AS ENUM (
    'percentage',
    'fixed',
    'multiplier'
);


ALTER TYPE public."enum_PriceRules_adjustmentType" OWNER TO postgres;

--
-- Name: enum_PriceRules_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PriceRules_type" AS ENUM (
    'last_minute',
    'early_bird',
    'length_of_stay',
    'weekend',
    'holiday',
    'special_event',
    'demand',
    'custom'
);


ALTER TYPE public."enum_PriceRules_type" OWNER TO postgres;

--
-- Name: enum_PropertyPolicies_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PropertyPolicies_type" AS ENUM (
    'cancellation',
    'refund',
    'house_rules',
    'check_in',
    'check_out',
    'security_deposit',
    'cleaning',
    'damage',
    'liability',
    'insurance',
    'other'
);


ALTER TYPE public."enum_PropertyPolicies_type" OWNER TO postgres;

--
-- Name: enum_PropertyRules_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PropertyRules_type" AS ENUM (
    'check_in',
    'check_out',
    'quiet_hours',
    'smoking',
    'pets',
    'parties',
    'children',
    'visitors',
    'parking',
    'amenities',
    'safety',
    'other'
);


ALTER TYPE public."enum_PropertyRules_type" OWNER TO postgres;

--
-- Name: enum_PropertyTypes_name; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_PropertyTypes_name" AS ENUM (
    'house',
    'apartment',
    'villa',
    'condo',
    'townhouse',
    'cabin',
    'cottage',
    'bungalow',
    'studio',
    'loft',
    'guesthouse',
    'farmhouse',
    'castle',
    'treehouse',
    'yurt',
    'tent',
    'boat',
    'other'
);


ALTER TYPE public."enum_PropertyTypes_name" OWNER TO postgres;

--
-- Name: enum_Reports_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Reports_reason" AS ENUM (
    'inappropriate_content',
    'fake_listing',
    'scam',
    'harassment',
    'spam',
    'other'
);


ALTER TYPE public."enum_Reports_reason" OWNER TO postgres;

--
-- Name: enum_Reports_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Reports_status" AS ENUM (
    'pending',
    'under_review',
    'resolved',
    'dismissed'
);


ALTER TYPE public."enum_Reports_status" OWNER TO postgres;

--
-- Name: enum_Reports_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Reports_type" AS ENUM (
    'listing',
    'user'
);


ALTER TYPE public."enum_Reports_type" OWNER TO postgres;

--
-- Name: enum_ReviewReports_reason; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ReviewReports_reason" AS ENUM (
    'inappropriate_content',
    'false_information',
    'spam',
    'hate_speech',
    'harassment',
    'other'
);


ALTER TYPE public."enum_ReviewReports_reason" OWNER TO postgres;

--
-- Name: enum_ReviewReports_resolution; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ReviewReports_resolution" AS ENUM (
    'removed',
    'edited',
    'no_action'
);


ALTER TYPE public."enum_ReviewReports_resolution" OWNER TO postgres;

--
-- Name: enum_ReviewReports_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ReviewReports_status" AS ENUM (
    'pending',
    'under_review',
    'resolved',
    'dismissed'
);


ALTER TYPE public."enum_ReviewReports_status" OWNER TO postgres;

--
-- Name: enum_Reviews_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Reviews_type" AS ENUM (
    'guest',
    'host'
);


ALTER TYPE public."enum_Reviews_type" OWNER TO postgres;

--
-- Name: enum_SeasonalPricing_adjustmentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_SeasonalPricing_adjustmentType" AS ENUM (
    'percentage',
    'fixed',
    'multiplier'
);


ALTER TYPE public."enum_SeasonalPricing_adjustmentType" OWNER TO postgres;

--
-- Name: enum_SystemSettings_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_SystemSettings_type" AS ENUM (
    'string',
    'number',
    'boolean',
    'json',
    'array'
);


ALTER TYPE public."enum_SystemSettings_type" OWNER TO postgres;

--
-- Name: enum_Verifications_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Verifications_method" AS ENUM (
    'email',
    'sms',
    'document',
    'payment',
    'manual',
    'system'
);


ALTER TYPE public."enum_Verifications_method" OWNER TO postgres;

--
-- Name: enum_Verifications_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Verifications_status" AS ENUM (
    'pending',
    'verified',
    'failed',
    'expired'
);


ALTER TYPE public."enum_Verifications_status" OWNER TO postgres;

--
-- Name: enum_Verifications_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_Verifications_type" AS ENUM (
    'email',
    'phone',
    'identity',
    'payment',
    'host',
    'government_id',
    'address',
    'other'
);


ALTER TYPE public."enum_Verifications_type" OWNER TO postgres;

--
-- Name: enum_ViewCounts_deviceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ViewCounts_deviceType" AS ENUM (
    'desktop',
    'mobile',
    'tablet'
);


ALTER TYPE public."enum_ViewCounts_deviceType" OWNER TO postgres;

--
-- Name: enum_ViewCounts_entityType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_ViewCounts_entityType" AS ENUM (
    'listing',
    'user',
    'category',
    'location'
);


ALTER TYPE public."enum_ViewCounts_entityType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Amenities" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(255),
    "parentId" integer,
    "isActive" boolean DEFAULT true,
    slug character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Amenities" OWNER TO postgres;

--
-- Name: Amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Amenities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Amenities_id_seq" OWNER TO postgres;

--
-- Name: Amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Amenities_id_seq" OWNED BY public."Amenities".id;


--
-- Name: BookingCalendars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BookingCalendars" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    date date NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "basePrice" numeric(10,2) NOT NULL,
    "minStay" integer DEFAULT 1 NOT NULL,
    "maxStay" integer,
    "checkInAllowed" boolean DEFAULT true NOT NULL,
    "checkOutAllowed" boolean DEFAULT true NOT NULL,
    notes text,
    metadata json DEFAULT '{}'::json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."BookingCalendars" OWNER TO postgres;

--
-- Name: BookingCalendars_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BookingCalendars_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BookingCalendars_id_seq" OWNER TO postgres;

--
-- Name: BookingCalendars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BookingCalendars_id_seq" OWNED BY public."BookingCalendars".id;


--
-- Name: BookingCancellations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BookingCancellations" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "cancelledBy" public."enum_BookingCancellations_cancelledBy" NOT NULL,
    "cancelledById" integer,
    reason text,
    "refundAmount" numeric(10,2),
    "cancellationFee" numeric(10,2),
    "cancellationDate" date NOT NULL,
    status public."enum_BookingCancellations_status" DEFAULT 'pending'::public."enum_BookingCancellations_status" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."BookingCancellations" OWNER TO postgres;

--
-- Name: BookingCancellations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BookingCancellations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BookingCancellations_id_seq" OWNER TO postgres;

--
-- Name: BookingCancellations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BookingCancellations_id_seq" OWNED BY public."BookingCancellations".id;


--
-- Name: BookingChanges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BookingChanges" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "requestedBy" public."enum_BookingChanges_requestedBy" NOT NULL,
    "requestedById" integer,
    "changeType" public."enum_BookingChanges_changeType" NOT NULL,
    "oldCheckIn" date,
    "newCheckIn" date,
    "oldCheckOut" date,
    "newCheckOut" date,
    "oldNumberOfGuests" integer,
    "newNumberOfGuests" integer,
    "oldTotalPrice" numeric(10,2),
    "newTotalPrice" numeric(10,2),
    reason text,
    status public."enum_BookingChanges_status" DEFAULT 'pending'::public."enum_BookingChanges_status" NOT NULL,
    "changeDate" date NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."BookingChanges" OWNER TO postgres;

--
-- Name: BookingChanges_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BookingChanges_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BookingChanges_id_seq" OWNER TO postgres;

--
-- Name: BookingChanges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BookingChanges_id_seq" OWNED BY public."BookingChanges".id;


--
-- Name: BookingRequests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BookingRequests" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    "guestId" integer NOT NULL,
    "hostId" integer NOT NULL,
    "checkIn" date NOT NULL,
    "checkOut" date NOT NULL,
    "numberOfGuests" integer DEFAULT 1 NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    message text,
    status public."enum_BookingRequests_status" DEFAULT 'pending'::public."enum_BookingRequests_status" NOT NULL,
    "responseMessage" text,
    "responseDate" timestamp with time zone,
    "expiresAt" timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '24:00:00'::interval) NOT NULL,
    "refundAmount" numeric(10,2),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."BookingRequests" OWNER TO postgres;

--
-- Name: BookingRequests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BookingRequests_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BookingRequests_id_seq" OWNER TO postgres;

--
-- Name: BookingRequests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BookingRequests_id_seq" OWNED BY public."BookingRequests".id;


--
-- Name: Bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bookings" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    "guestId" integer NOT NULL,
    "hostId" integer NOT NULL,
    "checkIn" date NOT NULL,
    "checkOut" date NOT NULL,
    "numberOfGuests" integer DEFAULT 1 NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    status public."enum_Bookings_status" DEFAULT 'pending'::public."enum_Bookings_status" NOT NULL,
    "paymentStatus" public."enum_Bookings_paymentStatus" DEFAULT 'pending'::public."enum_Bookings_paymentStatus" NOT NULL,
    "specialRequests" text,
    "cancellationReason" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer,
    "cancelledBy" integer
);


ALTER TABLE public."Bookings" OWNER TO postgres;

--
-- Name: Bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Bookings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Bookings_id_seq" OWNER TO postgres;

--
-- Name: Bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Bookings_id_seq" OWNED BY public."Bookings".id;


--
-- Name: Categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Categories" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(255),
    "parentId" integer,
    "isActive" boolean DEFAULT true,
    slug character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Categories" OWNER TO postgres;

--
-- Name: Categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Categories_id_seq" OWNER TO postgres;

--
-- Name: Categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Categories_id_seq" OWNED BY public."Categories".id;


--
-- Name: ClickCounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ClickCounts" (
    id integer NOT NULL,
    "entityType" public."enum_ClickCounts_entityType" NOT NULL,
    "entityId" integer NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    "lastClickedAt" timestamp with time zone,
    source character varying(255),
    "deviceType" public."enum_ClickCounts_deviceType",
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."ClickCounts" OWNER TO postgres;

--
-- Name: COLUMN "ClickCounts".source; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."ClickCounts".source IS 'Source of the click (e.g., search, recommendation, direct)';


--
-- Name: ClickCounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ClickCounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ClickCounts_id_seq" OWNER TO postgres;

--
-- Name: ClickCounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ClickCounts_id_seq" OWNED BY public."ClickCounts".id;


--
-- Name: ConversationParticipants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ConversationParticipants" (
    id integer NOT NULL,
    "conversationId" integer NOT NULL,
    "userId" integer NOT NULL,
    role public."enum_ConversationParticipants_role" NOT NULL,
    "lastReadAt" timestamp with time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."ConversationParticipants" OWNER TO postgres;

--
-- Name: ConversationParticipants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ConversationParticipants_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ConversationParticipants_id_seq" OWNER TO postgres;

--
-- Name: ConversationParticipants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ConversationParticipants_id_seq" OWNED BY public."ConversationParticipants".id;


--
-- Name: Conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversations" (
    id integer NOT NULL,
    "listingId" integer,
    title character varying(255),
    "lastMessageAt" timestamp with time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    status public."enum_Conversations_status" DEFAULT 'active'::public."enum_Conversations_status" NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userA" integer,
    "userB" integer
);


ALTER TABLE public."Conversations" OWNER TO postgres;

--
-- Name: COLUMN "Conversations".title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Conversations".title IS 'Optional conversation title';


--
-- Name: Conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Conversations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Conversations_id_seq" OWNER TO postgres;

--
-- Name: Conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Conversations_id_seq" OWNED BY public."Conversations".id;


--
-- Name: Documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Documents" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type public."enum_Documents_type" NOT NULL,
    "documentNumber" character varying(255),
    "issueDate" date,
    "expiryDate" date,
    "issuingCountry" character varying(255),
    "issuingAuthority" character varying(255),
    "fileUrl" character varying(255) NOT NULL,
    "fileType" character varying(255) NOT NULL,
    "fileSize" integer NOT NULL,
    status public."enum_Documents_status" DEFAULT 'pending'::public."enum_Documents_status" NOT NULL,
    "rejectionReason" text,
    "verifiedAt" timestamp with time zone,
    "verifiedById" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Documents" OWNER TO postgres;

--
-- Name: Documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Documents_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Documents_id_seq" OWNER TO postgres;

--
-- Name: Documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Documents_id_seq" OWNED BY public."Documents".id;


--
-- Name: GuestPreferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GuestPreferences" (
    id integer NOT NULL,
    "guestProfileId" integer NOT NULL,
    notifications json DEFAULT '{"email":{"bookingConfirmation":true,"bookingReminder":true,"reviewRequest":true,"specialOffers":true,"newsletter":false},"sms":{"bookingConfirmation":true,"bookingReminder":true,"urgentAlerts":true},"push":{"bookingUpdates":true,"messages":true,"deals":false}}'::json NOT NULL,
    privacy json DEFAULT '{"showProfile":true,"showReviews":true,"showBookings":false,"showWishlist":true,"showSocialLinks":false}'::json NOT NULL,
    "searchPreferences" json DEFAULT '{"priceRange":{"min":0,"max":1000},"propertyTypes":[],"amenities":[],"locations":[],"instantBook":false,"superhostOnly":false}'::json NOT NULL,
    "stayPreferences" json DEFAULT '{"checkInTime":"15:00","checkOutTime":"11:00","smoking":false,"pets":false,"accessibility":[],"houseRules":[]}'::json NOT NULL,
    "communicationPreferences" json DEFAULT '{"language":"en","timezone":"UTC","responseTime":"within_24_hours","autoTranslate":true}'::json NOT NULL,
    "paymentPreferences" json DEFAULT '{"currency":"USD","paymentMethods":[],"autoPay":false,"savePaymentInfo":false}'::json NOT NULL,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."GuestPreferences" OWNER TO postgres;

--
-- Name: GuestPreferences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."GuestPreferences_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GuestPreferences_id_seq" OWNER TO postgres;

--
-- Name: GuestPreferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."GuestPreferences_id_seq" OWNED BY public."GuestPreferences".id;


--
-- Name: GuestProfiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GuestProfiles" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "displayName" character varying(100) NOT NULL,
    "phoneNumber" character varying(20),
    "dateOfBirth" date,
    "preferredLanguage" character varying(5) DEFAULT 'en'::character varying NOT NULL,
    "preferredCurrency" character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationStatus" public."enum_GuestProfiles_verificationStatus" DEFAULT 'pending'::public."enum_GuestProfiles_verificationStatus" NOT NULL,
    "verificationDocuments" json DEFAULT '{}'::json,
    preferences json DEFAULT '{"notifications":{"email":true,"sms":false,"push":true},"privacy":{"showProfile":true,"showReviews":true}}'::json NOT NULL,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."GuestProfiles" OWNER TO postgres;

--
-- Name: GuestProfiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."GuestProfiles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GuestProfiles_id_seq" OWNER TO postgres;

--
-- Name: GuestProfiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."GuestProfiles_id_seq" OWNED BY public."GuestProfiles".id;


--
-- Name: GuestVerifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GuestVerifications" (
    id integer NOT NULL,
    "guestProfileId" integer NOT NULL,
    "documentType" public."enum_GuestVerifications_documentType" NOT NULL,
    "documentNumber" character varying(255) NOT NULL,
    "documentUrl" character varying(255) NOT NULL,
    status public."enum_GuestVerifications_status" DEFAULT 'pending'::public."enum_GuestVerifications_status" NOT NULL,
    "verifiedById" integer,
    "verifiedAt" timestamp with time zone,
    "rejectionReason" text,
    metadata json DEFAULT '{}'::json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."GuestVerifications" OWNER TO postgres;

--
-- Name: GuestVerifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."GuestVerifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."GuestVerifications_id_seq" OWNER TO postgres;

--
-- Name: GuestVerifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."GuestVerifications_id_seq" OWNED BY public."GuestVerifications".id;


--
-- Name: HostEarnings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HostEarnings" (
    id integer NOT NULL,
    "hostProfileId" integer NOT NULL,
    "bookingId" integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    type public."enum_HostEarnings_type" DEFAULT 'booking'::public."enum_HostEarnings_type" NOT NULL,
    status public."enum_HostEarnings_status" DEFAULT 'pending'::public."enum_HostEarnings_status" NOT NULL,
    "paymentMethod" public."enum_HostEarnings_paymentMethod",
    "paymentDetails" json,
    "processedAt" timestamp with time zone,
    "paidAt" timestamp with time zone,
    notes text,
    metadata json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."HostEarnings" OWNER TO postgres;

--
-- Name: HostEarnings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."HostEarnings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."HostEarnings_id_seq" OWNER TO postgres;

--
-- Name: HostEarnings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."HostEarnings_id_seq" OWNED BY public."HostEarnings".id;


--
-- Name: HostProfiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HostProfiles" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "displayName" character varying(255) NOT NULL,
    bio text,
    "profilePicture" character varying(255),
    "phoneNumber" character varying(255),
    "preferredLanguage" character varying(255) DEFAULT 'en'::character varying NOT NULL,
    "responseTime" integer,
    "responseRate" numeric(5,2),
    "isSuperhost" boolean DEFAULT false NOT NULL,
    "superhostSince" timestamp with time zone,
    "verificationStatus" public."enum_HostProfiles_verificationStatus" DEFAULT 'unverified'::public."enum_HostProfiles_verificationStatus" NOT NULL,
    "verificationDocuments" json DEFAULT '{}'::json,
    "notificationPreferences" json DEFAULT '{"email":true,"sms":false,"push":true,"bookingRequests":true,"messages":true,"reviews":true,"updates":true}'::json NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."HostProfiles" OWNER TO postgres;

--
-- Name: HostProfiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."HostProfiles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."HostProfiles_id_seq" OWNER TO postgres;

--
-- Name: HostProfiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."HostProfiles_id_seq" OWNED BY public."HostProfiles".id;


--
-- Name: HostVerifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."HostVerifications" (
    id integer NOT NULL,
    "hostId" integer NOT NULL,
    type public."enum_HostVerifications_type" NOT NULL,
    status public."enum_HostVerifications_status" DEFAULT 'pending'::public."enum_HostVerifications_status" NOT NULL,
    documents json DEFAULT '{}'::json,
    "verifiedAt" timestamp with time zone,
    "verifiedById" integer,
    "rejectedAt" timestamp with time zone,
    "rejectedById" integer,
    "rejectionReason" text,
    "expiresAt" timestamp with time zone,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."HostVerifications" OWNER TO postgres;

--
-- Name: HostVerifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."HostVerifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."HostVerifications_id_seq" OWNER TO postgres;

--
-- Name: HostVerifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."HostVerifications_id_seq" OWNED BY public."HostVerifications".id;


--
-- Name: Listings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Listings" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text NOT NULL,
    "hostId" integer NOT NULL,
    "propertyTypeId" integer,
    "roomTypeId" integer,
    "categoryId" integer,
    "locationId" integer,
    accommodates integer,
    bedrooms integer,
    beds integer,
    bathrooms double precision,
    "pricePerNight" numeric(10,2),
    "cleaningFee" numeric(10,2),
    "securityDeposit" numeric(10,2),
    "minimumNights" integer DEFAULT 1 NOT NULL,
    "maximumNights" integer DEFAULT 1 NOT NULL,
    "cancellationPolicy" public."enum_Listings_cancellationPolicy" DEFAULT 'moderate'::public."enum_Listings_cancellationPolicy",
    address json,
    coordinates json,
    "isActive" boolean DEFAULT true NOT NULL,
    "instantBookable" boolean DEFAULT false NOT NULL,
    status public."enum_Listings_status" DEFAULT 'draft'::public."enum_Listings_status" NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    "averageRating" double precision,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "stepStatus" json DEFAULT '{"basicInfo":false,"location":false,"details":false,"pricing":false,"photos":false,"rules":false,"calendar":false}'::json NOT NULL,
    "defaultAvailability" boolean DEFAULT true NOT NULL,
    "checkInDays" integer[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6] NOT NULL,
    "checkOutDays" integer[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6] NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "hostProfileId" integer
);


ALTER TABLE public."Listings" OWNER TO postgres;

--
-- Name: COLUMN "Listings".coordinates; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."Listings".coordinates IS 'Stores latitude and longitude as {lat: number, lng: number}';


--
-- Name: Listings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Listings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Listings_id_seq" OWNER TO postgres;

--
-- Name: Listings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Listings_id_seq" OWNED BY public."Listings".id;


--
-- Name: Locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Locations" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(255),
    "parentId" integer,
    "isActive" boolean DEFAULT true,
    slug character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Locations" OWNER TO postgres;

--
-- Name: Locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Locations_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Locations_id_seq" OWNER TO postgres;

--
-- Name: Locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Locations_id_seq" OWNED BY public."Locations".id;


--
-- Name: Maintenances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Maintenances" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "startTime" timestamp with time zone NOT NULL,
    "endTime" timestamp with time zone NOT NULL,
    status public."enum_Maintenances_status" DEFAULT 'scheduled'::public."enum_Maintenances_status" NOT NULL,
    type public."enum_Maintenances_type" DEFAULT 'system'::public."enum_Maintenances_type" NOT NULL,
    impact public."enum_Maintenances_impact" DEFAULT 'medium'::public."enum_Maintenances_impact" NOT NULL,
    "affectedServices" json DEFAULT '[]'::json,
    "createdById" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."Maintenances" OWNER TO postgres;

--
-- Name: Maintenances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Maintenances_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Maintenances_id_seq" OWNER TO postgres;

--
-- Name: Maintenances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Maintenances_id_seq" OWNED BY public."Maintenances".id;


--
-- Name: MessageAttachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MessageAttachments" (
    id integer NOT NULL,
    "messageId" integer NOT NULL,
    "fileName" character varying(255) NOT NULL,
    "fileType" character varying(100) NOT NULL,
    "fileSize" integer NOT NULL,
    "filePath" character varying(500) NOT NULL,
    "thumbnailPath" character varying(500),
    width integer,
    height integer,
    duration integer,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."MessageAttachments" OWNER TO postgres;

--
-- Name: MessageAttachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."MessageAttachments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MessageAttachments_id_seq" OWNER TO postgres;

--
-- Name: MessageAttachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."MessageAttachments_id_seq" OWNED BY public."MessageAttachments".id;


--
-- Name: Messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Messages" (
    id integer NOT NULL,
    "conversationId" integer NOT NULL,
    "senderId" integer NOT NULL,
    content text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp with time zone,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "receiverId" integer,
    "bookingId" integer
);


ALTER TABLE public."Messages" OWNER TO postgres;

--
-- Name: Messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Messages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Messages_id_seq" OWNER TO postgres;

--
-- Name: Messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Messages_id_seq" OWNED BY public."Messages".id;


--
-- Name: Notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notifications" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type public."enum_Notifications_type" DEFAULT 'info'::public."enum_Notifications_type" NOT NULL,
    category public."enum_Notifications_category" DEFAULT 'system'::public."enum_Notifications_category" NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "readAt" timestamp with time zone,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Notifications" OWNER TO postgres;

--
-- Name: Notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Notifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Notifications_id_seq" OWNER TO postgres;

--
-- Name: Notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Notifications_id_seq" OWNED BY public."Notifications".id;


--
-- Name: Payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payments" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    "paymentMethod" public."enum_Payments_paymentMethod" NOT NULL,
    "paymentDetails" json,
    "idempotencyKey" character varying(255),
    status public."enum_Payments_status" DEFAULT 'pending'::public."enum_Payments_status" NOT NULL,
    "processedAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    "refundedAt" timestamp with time zone,
    "failureReason" text,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."Payments" OWNER TO postgres;

--
-- Name: Payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Payments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Payments_id_seq" OWNER TO postgres;

--
-- Name: Payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Payments_id_seq" OWNED BY public."Payments".id;


--
-- Name: PayoutAccounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayoutAccounts" (
    id integer NOT NULL,
    "hostProfileId" integer NOT NULL,
    "accountType" public."enum_PayoutAccounts_accountType" NOT NULL,
    "accountDetails" json NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationStatus" public."enum_PayoutAccounts_verificationStatus" DEFAULT 'pending'::public."enum_PayoutAccounts_verificationStatus" NOT NULL,
    "verificationDocuments" json,
    "lastUsedAt" timestamp with time zone,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."PayoutAccounts" OWNER TO postgres;

--
-- Name: PayoutAccounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PayoutAccounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PayoutAccounts_id_seq" OWNER TO postgres;

--
-- Name: PayoutAccounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PayoutAccounts_id_seq" OWNED BY public."PayoutAccounts".id;


--
-- Name: Photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Photos" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    url character varying(255) NOT NULL,
    "thumbnailUrl" character varying(255),
    "fileType" character varying(255) NOT NULL,
    "fileSize" integer NOT NULL,
    width integer,
    height integer,
    caption character varying(255),
    category public."enum_Photos_category" DEFAULT 'other'::public."enum_Photos_category" NOT NULL,
    tags character varying(255)[] DEFAULT (ARRAY[]::character varying[])::character varying(255)[],
    "takenAt" timestamp with time zone,
    "isCover" boolean DEFAULT false NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    status public."enum_Photos_status" DEFAULT 'approved'::public."enum_Photos_status" NOT NULL,
    "rejectionReason" character varying(255),
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Photos" OWNER TO postgres;

--
-- Name: Photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Photos_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Photos_id_seq" OWNER TO postgres;

--
-- Name: Photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Photos_id_seq" OWNED BY public."Photos".id;


--
-- Name: PriceRules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PriceRules" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    name character varying(100) NOT NULL,
    type public."enum_PriceRules_type" DEFAULT 'custom'::public."enum_PriceRules_type" NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    condition json DEFAULT '{}'::json NOT NULL,
    "adjustmentType" public."enum_PriceRules_adjustmentType" DEFAULT 'percentage'::public."enum_PriceRules_adjustmentType" NOT NULL,
    "adjustmentValue" numeric(10,2) NOT NULL,
    "minStay" integer,
    "maxStay" integer,
    priority integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    metadata json DEFAULT '{}'::json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."PriceRules" OWNER TO postgres;

--
-- Name: COLUMN "PriceRules".condition; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."PriceRules".condition IS 'JSON conditions for rule application';


--
-- Name: COLUMN "PriceRules".priority; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."PriceRules".priority IS 'Higher priority rules are applied first';


--
-- Name: PriceRules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PriceRules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PriceRules_id_seq" OWNER TO postgres;

--
-- Name: PriceRules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PriceRules_id_seq" OWNED BY public."PriceRules".id;


--
-- Name: PropertyAvailabilities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PropertyAvailabilities" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    date date NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    price numeric(10,2) NOT NULL,
    "minimumNights" integer DEFAULT 1 NOT NULL,
    "maximumNights" integer,
    "checkInTime" time without time zone,
    "checkOutTime" time without time zone,
    notes text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."PropertyAvailabilities" OWNER TO postgres;

--
-- Name: PropertyAvailabilities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PropertyAvailabilities_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PropertyAvailabilities_id_seq" OWNER TO postgres;

--
-- Name: PropertyAvailabilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PropertyAvailabilities_id_seq" OWNED BY public."PropertyAvailabilities".id;


--
-- Name: PropertyPolicies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PropertyPolicies" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    type public."enum_PropertyPolicies_type" NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    terms json DEFAULT '{}'::json,
    conditions json DEFAULT '{}'::json,
    exceptions json DEFAULT '{}'::json,
    "lastUpdated" timestamp with time zone NOT NULL,
    version character varying(255) DEFAULT '1.0'::character varying NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "requiresAgreement" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."PropertyPolicies" OWNER TO postgres;

--
-- Name: PropertyPolicies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PropertyPolicies_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PropertyPolicies_id_seq" OWNER TO postgres;

--
-- Name: PropertyPolicies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PropertyPolicies_id_seq" OWNED BY public."PropertyPolicies".id;


--
-- Name: PropertyRules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PropertyRules" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    type public."enum_PropertyRules_type" NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "isAllowed" boolean DEFAULT true NOT NULL,
    restrictions json DEFAULT '{}'::json,
    penalty character varying(255),
    "isActive" boolean DEFAULT true NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."PropertyRules" OWNER TO postgres;

--
-- Name: PropertyRules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PropertyRules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PropertyRules_id_seq" OWNER TO postgres;

--
-- Name: PropertyRules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PropertyRules_id_seq" OWNED BY public."PropertyRules".id;


--
-- Name: PropertyTypes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PropertyTypes" (
    id integer NOT NULL,
    name public."enum_PropertyTypes_name" NOT NULL,
    description text,
    icon character varying(255),
    "isActive" boolean DEFAULT true,
    slug character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."PropertyTypes" OWNER TO postgres;

--
-- Name: PropertyTypes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PropertyTypes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PropertyTypes_id_seq" OWNER TO postgres;

--
-- Name: PropertyTypes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PropertyTypes_id_seq" OWNED BY public."PropertyTypes".id;


--
-- Name: Reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Reports" (
    id integer NOT NULL,
    type public."enum_Reports_type" NOT NULL,
    reason public."enum_Reports_reason" NOT NULL,
    description text NOT NULL,
    status public."enum_Reports_status" DEFAULT 'pending'::public."enum_Reports_status" NOT NULL,
    resolution text,
    "resolvedAt" timestamp with time zone,
    "reporterId" integer NOT NULL,
    "reportedUserId" integer,
    "listingId" integer,
    "resolvedById" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Reports" OWNER TO postgres;

--
-- Name: Reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Reports_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Reports_id_seq" OWNER TO postgres;

--
-- Name: Reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Reports_id_seq" OWNED BY public."Reports".id;


--
-- Name: ReviewReports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReviewReports" (
    id integer NOT NULL,
    "reviewId" integer NOT NULL,
    "reporterId" integer NOT NULL,
    reason public."enum_ReviewReports_reason" NOT NULL,
    description text,
    status public."enum_ReviewReports_status" DEFAULT 'pending'::public."enum_ReviewReports_status" NOT NULL,
    resolution public."enum_ReviewReports_resolution",
    "resolvedAt" timestamp with time zone,
    "resolvedById" integer,
    "resolutionNotes" text,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."ReviewReports" OWNER TO postgres;

--
-- Name: ReviewReports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ReviewReports_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ReviewReports_id_seq" OWNER TO postgres;

--
-- Name: ReviewReports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ReviewReports_id_seq" OWNED BY public."ReviewReports".id;


--
-- Name: ReviewResponses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReviewResponses" (
    id integer NOT NULL,
    "reviewId" integer NOT NULL,
    "hostId" integer NOT NULL,
    content text NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "editedAt" timestamp with time zone,
    "editCount" integer DEFAULT 0 NOT NULL,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."ReviewResponses" OWNER TO postgres;

--
-- Name: ReviewResponses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ReviewResponses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ReviewResponses_id_seq" OWNER TO postgres;

--
-- Name: ReviewResponses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ReviewResponses_id_seq" OWNED BY public."ReviewResponses".id;


--
-- Name: Reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Reviews" (
    id integer NOT NULL,
    "bookingId" integer NOT NULL,
    "reviewerId" integer NOT NULL,
    "reviewedId" integer NOT NULL,
    rating integer NOT NULL,
    comment text,
    type public."enum_Reviews_type" NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    response text,
    "responseDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer,
    "listingId" integer,
    "guestId" integer
);


ALTER TABLE public."Reviews" OWNER TO postgres;

--
-- Name: Reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Reviews_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Reviews_id_seq" OWNER TO postgres;

--
-- Name: Reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Reviews_id_seq" OWNED BY public."Reviews".id;


--
-- Name: RoomTypes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RoomTypes" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(255),
    "isActive" boolean DEFAULT true,
    slug character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."RoomTypes" OWNER TO postgres;

--
-- Name: RoomTypes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."RoomTypes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."RoomTypes_id_seq" OWNER TO postgres;

--
-- Name: RoomTypes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."RoomTypes_id_seq" OWNED BY public."RoomTypes".id;


--
-- Name: SearchFilters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SearchFilters" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    name character varying(100) NOT NULL,
    filters json DEFAULT '{}'::json NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "lastUsedAt" timestamp with time zone,
    "useCount" integer DEFAULT 0 NOT NULL,
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."SearchFilters" OWNER TO postgres;

--
-- Name: SearchFilters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SearchFilters_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SearchFilters_id_seq" OWNER TO postgres;

--
-- Name: SearchFilters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SearchFilters_id_seq" OWNED BY public."SearchFilters".id;


--
-- Name: SearchHistories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SearchHistories" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    query character varying(255) NOT NULL,
    filters json DEFAULT '{}'::json,
    location character varying(100),
    coordinates json,
    radius integer,
    "resultCount" integer DEFAULT 0 NOT NULL,
    "viewedResults" integer DEFAULT 0 NOT NULL,
    "clickedResults" integer DEFAULT 0 NOT NULL,
    "deviceInfo" json,
    "sessionId" character varying(255),
    metadata json DEFAULT '{}'::json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."SearchHistories" OWNER TO postgres;

--
-- Name: SearchHistories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SearchHistories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SearchHistories_id_seq" OWNER TO postgres;

--
-- Name: SearchHistories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SearchHistories_id_seq" OWNED BY public."SearchHistories".id;


--
-- Name: SeasonalPricing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SeasonalPricing" (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    name character varying(100) NOT NULL,
    "startDate" date NOT NULL,
    "endDate" date NOT NULL,
    "adjustmentType" public."enum_SeasonalPricing_adjustmentType" DEFAULT 'percentage'::public."enum_SeasonalPricing_adjustmentType" NOT NULL,
    "adjustmentValue" numeric(10,2) NOT NULL,
    "minStay" integer,
    "maxStay" integer,
    priority integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    notes text,
    metadata json DEFAULT '{}'::json,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."SeasonalPricing" OWNER TO postgres;

--
-- Name: COLUMN "SeasonalPricing".priority; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."SeasonalPricing".priority IS 'Higher priority rules are applied first';


--
-- Name: SeasonalPricing_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SeasonalPricing_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SeasonalPricing_id_seq" OWNER TO postgres;

--
-- Name: SeasonalPricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SeasonalPricing_id_seq" OWNED BY public."SeasonalPricing".id;


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: SystemSettings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemSettings" (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    value text NOT NULL,
    type public."enum_SystemSettings_type" DEFAULT 'string'::public."enum_SystemSettings_type" NOT NULL,
    description character varying(255),
    category character varying(255) DEFAULT 'general'::character varying NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."SystemSettings" OWNER TO postgres;

--
-- Name: SystemSettings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."SystemSettings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."SystemSettings_id_seq" OWNER TO postgres;

--
-- Name: SystemSettings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."SystemSettings_id_seq" OWNED BY public."SystemSettings".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    "passwordHash" character varying(255) NOT NULL,
    phone character varying(255),
    "isVerified" boolean DEFAULT false,
    "emailVerifiedAt" timestamp with time zone,
    "emailVerificationToken" character varying(255),
    "passwordResetToken" character varying(255),
    "passwordResetExpires" timestamp with time zone,
    "profilePicture" character varying(255),
    bio text,
    language character varying(255) DEFAULT 'en'::character varying,
    currency character varying(255) DEFAULT 'USD'::character varying,
    timezone character varying(255) DEFAULT 'UTC'::character varying,
    country character varying(255),
    address json,
    "notificationPreferences" json DEFAULT '{"email":true,"push":true,"sms":false}'::json,
    "privacySettings" json DEFAULT '{"profileVisibility":"public","showEmail":false,"showPhone":false}'::json,
    "dataConsent" boolean DEFAULT false,
    "socialLinks" json,
    "referralCode" character varying(255),
    "referredBy" integer,
    "lastLogin" timestamp with time zone,
    "lastActivity" timestamp with time zone,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_id_seq" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: Verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Verifications" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type public."enum_Verifications_type" NOT NULL,
    method public."enum_Verifications_method" NOT NULL,
    status public."enum_Verifications_status" DEFAULT 'pending'::public."enum_Verifications_status" NOT NULL,
    token character varying(255),
    code character varying(255),
    "expiresAt" timestamp with time zone,
    "verifiedAt" timestamp with time zone,
    "verifiedById" integer,
    "failureReason" text,
    metadata json,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


ALTER TABLE public."Verifications" OWNER TO postgres;

--
-- Name: Verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Verifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Verifications_id_seq" OWNER TO postgres;

--
-- Name: Verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Verifications_id_seq" OWNED BY public."Verifications".id;


--
-- Name: ViewCounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ViewCounts" (
    id integer NOT NULL,
    "entityType" public."enum_ViewCounts_entityType" NOT NULL,
    "entityId" integer NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    "lastViewedAt" timestamp with time zone,
    source character varying(255),
    "deviceType" public."enum_ViewCounts_deviceType",
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "userId" integer
);


ALTER TABLE public."ViewCounts" OWNER TO postgres;

--
-- Name: COLUMN "ViewCounts".source; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public."ViewCounts".source IS 'Source of the view (e.g., search, recommendation, direct)';


--
-- Name: ViewCounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ViewCounts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ViewCounts_id_seq" OWNER TO postgres;

--
-- Name: ViewCounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ViewCounts_id_seq" OWNED BY public."ViewCounts".id;


--
-- Name: listing_amenities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listing_amenities (
    id integer NOT NULL,
    "listingId" integer NOT NULL,
    "amenityId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.listing_amenities OWNER TO postgres;

--
-- Name: listing_amenities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.listing_amenities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listing_amenities_id_seq OWNER TO postgres;

--
-- Name: listing_amenities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.listing_amenities_id_seq OWNED BY public.listing_amenities.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "roleId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_id_seq OWNER TO postgres;

--
-- Name: user_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_id_seq OWNED BY public.user_roles.id;


--
-- Name: Amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Amenities" ALTER COLUMN id SET DEFAULT nextval('public."Amenities_id_seq"'::regclass);


--
-- Name: BookingCalendars id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCalendars" ALTER COLUMN id SET DEFAULT nextval('public."BookingCalendars_id_seq"'::regclass);


--
-- Name: BookingCancellations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCancellations" ALTER COLUMN id SET DEFAULT nextval('public."BookingCancellations_id_seq"'::regclass);


--
-- Name: BookingChanges id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingChanges" ALTER COLUMN id SET DEFAULT nextval('public."BookingChanges_id_seq"'::regclass);


--
-- Name: BookingRequests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingRequests" ALTER COLUMN id SET DEFAULT nextval('public."BookingRequests_id_seq"'::regclass);


--
-- Name: Bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bookings" ALTER COLUMN id SET DEFAULT nextval('public."Bookings_id_seq"'::regclass);


--
-- Name: Categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Categories" ALTER COLUMN id SET DEFAULT nextval('public."Categories_id_seq"'::regclass);


--
-- Name: ClickCounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClickCounts" ALTER COLUMN id SET DEFAULT nextval('public."ClickCounts_id_seq"'::regclass);


--
-- Name: ConversationParticipants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationParticipants" ALTER COLUMN id SET DEFAULT nextval('public."ConversationParticipants_id_seq"'::regclass);


--
-- Name: Conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversations" ALTER COLUMN id SET DEFAULT nextval('public."Conversations_id_seq"'::regclass);


--
-- Name: Documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documents" ALTER COLUMN id SET DEFAULT nextval('public."Documents_id_seq"'::regclass);


--
-- Name: GuestPreferences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestPreferences" ALTER COLUMN id SET DEFAULT nextval('public."GuestPreferences_id_seq"'::regclass);


--
-- Name: GuestProfiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestProfiles" ALTER COLUMN id SET DEFAULT nextval('public."GuestProfiles_id_seq"'::regclass);


--
-- Name: GuestVerifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestVerifications" ALTER COLUMN id SET DEFAULT nextval('public."GuestVerifications_id_seq"'::regclass);


--
-- Name: HostEarnings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostEarnings" ALTER COLUMN id SET DEFAULT nextval('public."HostEarnings_id_seq"'::regclass);


--
-- Name: HostProfiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostProfiles" ALTER COLUMN id SET DEFAULT nextval('public."HostProfiles_id_seq"'::regclass);


--
-- Name: HostVerifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostVerifications" ALTER COLUMN id SET DEFAULT nextval('public."HostVerifications_id_seq"'::regclass);


--
-- Name: Listings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings" ALTER COLUMN id SET DEFAULT nextval('public."Listings_id_seq"'::regclass);


--
-- Name: Locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Locations" ALTER COLUMN id SET DEFAULT nextval('public."Locations_id_seq"'::regclass);


--
-- Name: Maintenances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenances" ALTER COLUMN id SET DEFAULT nextval('public."Maintenances_id_seq"'::regclass);


--
-- Name: MessageAttachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachments" ALTER COLUMN id SET DEFAULT nextval('public."MessageAttachments_id_seq"'::regclass);


--
-- Name: Messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages" ALTER COLUMN id SET DEFAULT nextval('public."Messages_id_seq"'::regclass);


--
-- Name: Notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications" ALTER COLUMN id SET DEFAULT nextval('public."Notifications_id_seq"'::regclass);


--
-- Name: Payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments" ALTER COLUMN id SET DEFAULT nextval('public."Payments_id_seq"'::regclass);


--
-- Name: PayoutAccounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutAccounts" ALTER COLUMN id SET DEFAULT nextval('public."PayoutAccounts_id_seq"'::regclass);


--
-- Name: Photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos" ALTER COLUMN id SET DEFAULT nextval('public."Photos_id_seq"'::regclass);


--
-- Name: PriceRules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PriceRules" ALTER COLUMN id SET DEFAULT nextval('public."PriceRules_id_seq"'::regclass);


--
-- Name: PropertyAvailabilities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyAvailabilities" ALTER COLUMN id SET DEFAULT nextval('public."PropertyAvailabilities_id_seq"'::regclass);


--
-- Name: PropertyPolicies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyPolicies" ALTER COLUMN id SET DEFAULT nextval('public."PropertyPolicies_id_seq"'::regclass);


--
-- Name: PropertyRules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyRules" ALTER COLUMN id SET DEFAULT nextval('public."PropertyRules_id_seq"'::regclass);


--
-- Name: PropertyTypes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyTypes" ALTER COLUMN id SET DEFAULT nextval('public."PropertyTypes_id_seq"'::regclass);


--
-- Name: Reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reports" ALTER COLUMN id SET DEFAULT nextval('public."Reports_id_seq"'::regclass);


--
-- Name: ReviewReports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewReports" ALTER COLUMN id SET DEFAULT nextval('public."ReviewReports_id_seq"'::regclass);


--
-- Name: ReviewResponses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewResponses" ALTER COLUMN id SET DEFAULT nextval('public."ReviewResponses_id_seq"'::regclass);


--
-- Name: Reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews" ALTER COLUMN id SET DEFAULT nextval('public."Reviews_id_seq"'::regclass);


--
-- Name: RoomTypes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomTypes" ALTER COLUMN id SET DEFAULT nextval('public."RoomTypes_id_seq"'::regclass);


--
-- Name: SearchFilters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SearchFilters" ALTER COLUMN id SET DEFAULT nextval('public."SearchFilters_id_seq"'::regclass);


--
-- Name: SearchHistories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SearchHistories" ALTER COLUMN id SET DEFAULT nextval('public."SearchHistories_id_seq"'::regclass);


--
-- Name: SeasonalPricing id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeasonalPricing" ALTER COLUMN id SET DEFAULT nextval('public."SeasonalPricing_id_seq"'::regclass);


--
-- Name: SystemSettings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSettings" ALTER COLUMN id SET DEFAULT nextval('public."SystemSettings_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: Verifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Verifications" ALTER COLUMN id SET DEFAULT nextval('public."Verifications_id_seq"'::regclass);


--
-- Name: ViewCounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ViewCounts" ALTER COLUMN id SET DEFAULT nextval('public."ViewCounts_id_seq"'::regclass);


--
-- Name: listing_amenities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_amenities ALTER COLUMN id SET DEFAULT nextval('public.listing_amenities_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: user_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN id SET DEFAULT nextval('public.user_roles_id_seq'::regclass);


--
-- Name: Amenities Amenities_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Amenities"
    ADD CONSTRAINT "Amenities_name_key" UNIQUE (name);


--
-- Name: Amenities Amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Amenities"
    ADD CONSTRAINT "Amenities_pkey" PRIMARY KEY (id);


--
-- Name: Amenities Amenities_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Amenities"
    ADD CONSTRAINT "Amenities_slug_key" UNIQUE (slug);


--
-- Name: BookingCalendars BookingCalendars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCalendars"
    ADD CONSTRAINT "BookingCalendars_pkey" PRIMARY KEY (id);


--
-- Name: BookingCancellations BookingCancellations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCancellations"
    ADD CONSTRAINT "BookingCancellations_pkey" PRIMARY KEY (id);


--
-- Name: BookingChanges BookingChanges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingChanges"
    ADD CONSTRAINT "BookingChanges_pkey" PRIMARY KEY (id);


--
-- Name: BookingRequests BookingRequests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingRequests"
    ADD CONSTRAINT "BookingRequests_pkey" PRIMARY KEY (id);


--
-- Name: Bookings Bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_pkey" PRIMARY KEY (id);


--
-- Name: Categories Categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_name_key" UNIQUE (name);


--
-- Name: Categories Categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_pkey" PRIMARY KEY (id);


--
-- Name: Categories Categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_slug_key" UNIQUE (slug);


--
-- Name: ClickCounts ClickCounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClickCounts"
    ADD CONSTRAINT "ClickCounts_pkey" PRIMARY KEY (id);


--
-- Name: ConversationParticipants ConversationParticipants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationParticipants"
    ADD CONSTRAINT "ConversationParticipants_pkey" PRIMARY KEY (id);


--
-- Name: Conversations Conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversations"
    ADD CONSTRAINT "Conversations_pkey" PRIMARY KEY (id);


--
-- Name: Documents Documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documents"
    ADD CONSTRAINT "Documents_pkey" PRIMARY KEY (id);


--
-- Name: GuestPreferences GuestPreferences_guestProfileId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestPreferences"
    ADD CONSTRAINT "GuestPreferences_guestProfileId_key" UNIQUE ("guestProfileId");


--
-- Name: GuestPreferences GuestPreferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestPreferences"
    ADD CONSTRAINT "GuestPreferences_pkey" PRIMARY KEY (id);


--
-- Name: GuestProfiles GuestProfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestProfiles"
    ADD CONSTRAINT "GuestProfiles_pkey" PRIMARY KEY (id);


--
-- Name: GuestProfiles GuestProfiles_userId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestProfiles"
    ADD CONSTRAINT "GuestProfiles_userId_key" UNIQUE ("userId");


--
-- Name: GuestVerifications GuestVerifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestVerifications"
    ADD CONSTRAINT "GuestVerifications_pkey" PRIMARY KEY (id);


--
-- Name: HostEarnings HostEarnings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostEarnings"
    ADD CONSTRAINT "HostEarnings_pkey" PRIMARY KEY (id);


--
-- Name: HostProfiles HostProfiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostProfiles"
    ADD CONSTRAINT "HostProfiles_pkey" PRIMARY KEY (id);


--
-- Name: HostProfiles HostProfiles_userId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostProfiles"
    ADD CONSTRAINT "HostProfiles_userId_key" UNIQUE ("userId");


--
-- Name: HostVerifications HostVerifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostVerifications"
    ADD CONSTRAINT "HostVerifications_pkey" PRIMARY KEY (id);


--
-- Name: Listings Listings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_pkey" PRIMARY KEY (id);


--
-- Name: Listings Listings_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_slug_key" UNIQUE (slug);


--
-- Name: Locations Locations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Locations"
    ADD CONSTRAINT "Locations_name_key" UNIQUE (name);


--
-- Name: Locations Locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Locations"
    ADD CONSTRAINT "Locations_pkey" PRIMARY KEY (id);


--
-- Name: Locations Locations_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Locations"
    ADD CONSTRAINT "Locations_slug_key" UNIQUE (slug);


--
-- Name: Maintenances Maintenances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenances"
    ADD CONSTRAINT "Maintenances_pkey" PRIMARY KEY (id);


--
-- Name: MessageAttachments MessageAttachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachments"
    ADD CONSTRAINT "MessageAttachments_pkey" PRIMARY KEY (id);


--
-- Name: Messages Messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_pkey" PRIMARY KEY (id);


--
-- Name: Notifications Notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_pkey" PRIMARY KEY (id);


--
-- Name: Payments Payments_idempotencyKey_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_idempotencyKey_key" UNIQUE ("idempotencyKey");


--
-- Name: Payments Payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_pkey" PRIMARY KEY (id);


--
-- Name: PayoutAccounts PayoutAccounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutAccounts"
    ADD CONSTRAINT "PayoutAccounts_pkey" PRIMARY KEY (id);


--
-- Name: Photos Photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_pkey" PRIMARY KEY (id);


--
-- Name: PriceRules PriceRules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PriceRules"
    ADD CONSTRAINT "PriceRules_pkey" PRIMARY KEY (id);


--
-- Name: PropertyAvailabilities PropertyAvailabilities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyAvailabilities"
    ADD CONSTRAINT "PropertyAvailabilities_pkey" PRIMARY KEY (id);


--
-- Name: PropertyPolicies PropertyPolicies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyPolicies"
    ADD CONSTRAINT "PropertyPolicies_pkey" PRIMARY KEY (id);


--
-- Name: PropertyRules PropertyRules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyRules"
    ADD CONSTRAINT "PropertyRules_pkey" PRIMARY KEY (id);


--
-- Name: PropertyTypes PropertyTypes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyTypes"
    ADD CONSTRAINT "PropertyTypes_name_key" UNIQUE (name);


--
-- Name: PropertyTypes PropertyTypes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyTypes"
    ADD CONSTRAINT "PropertyTypes_pkey" PRIMARY KEY (id);


--
-- Name: PropertyTypes PropertyTypes_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyTypes"
    ADD CONSTRAINT "PropertyTypes_slug_key" UNIQUE (slug);


--
-- Name: Reports Reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reports"
    ADD CONSTRAINT "Reports_pkey" PRIMARY KEY (id);


--
-- Name: ReviewReports ReviewReports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewReports"
    ADD CONSTRAINT "ReviewReports_pkey" PRIMARY KEY (id);


--
-- Name: ReviewResponses ReviewResponses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewResponses"
    ADD CONSTRAINT "ReviewResponses_pkey" PRIMARY KEY (id);


--
-- Name: ReviewResponses ReviewResponses_reviewId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewResponses"
    ADD CONSTRAINT "ReviewResponses_reviewId_key" UNIQUE ("reviewId");


--
-- Name: Reviews Reviews_bookingId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_bookingId_key" UNIQUE ("bookingId");


--
-- Name: Reviews Reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_pkey" PRIMARY KEY (id);


--
-- Name: RoomTypes RoomTypes_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomTypes"
    ADD CONSTRAINT "RoomTypes_name_key" UNIQUE (name);


--
-- Name: RoomTypes RoomTypes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomTypes"
    ADD CONSTRAINT "RoomTypes_pkey" PRIMARY KEY (id);


--
-- Name: RoomTypes RoomTypes_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RoomTypes"
    ADD CONSTRAINT "RoomTypes_slug_key" UNIQUE (slug);


--
-- Name: SearchFilters SearchFilters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SearchFilters"
    ADD CONSTRAINT "SearchFilters_pkey" PRIMARY KEY (id);


--
-- Name: SearchHistories SearchHistories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SearchHistories"
    ADD CONSTRAINT "SearchHistories_pkey" PRIMARY KEY (id);


--
-- Name: SeasonalPricing SeasonalPricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeasonalPricing"
    ADD CONSTRAINT "SeasonalPricing_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: SystemSettings SystemSettings_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSettings"
    ADD CONSTRAINT "SystemSettings_key_key" UNIQUE (key);


--
-- Name: SystemSettings SystemSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSettings"
    ADD CONSTRAINT "SystemSettings_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_referralCode_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_referralCode_key" UNIQUE ("referralCode");


--
-- Name: Verifications Verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Verifications"
    ADD CONSTRAINT "Verifications_pkey" PRIMARY KEY (id);


--
-- Name: ViewCounts ViewCounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ViewCounts"
    ADD CONSTRAINT "ViewCounts_pkey" PRIMARY KEY (id);


--
-- Name: listing_amenities listing_amenities_listingId_amenityId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_amenities
    ADD CONSTRAINT "listing_amenities_listingId_amenityId_key" UNIQUE ("listingId", "amenityId");


--
-- Name: listing_amenities listing_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_amenities
    ADD CONSTRAINT listing_amenities_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_userId_roleId_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_roleId_key" UNIQUE ("userId", "roleId");


--
-- Name: amenities_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX amenities_deleted_at ON public."Amenities" USING btree ("deletedAt");


--
-- Name: amenities_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX amenities_is_active ON public."Amenities" USING btree ("isActive");


--
-- Name: amenities_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX amenities_name ON public."Amenities" USING btree (name);


--
-- Name: amenities_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX amenities_parent_id ON public."Amenities" USING btree ("parentId");


--
-- Name: amenities_parent_id_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX amenities_parent_id_is_active ON public."Amenities" USING btree ("parentId", "isActive");


--
-- Name: amenities_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX amenities_slug ON public."Amenities" USING btree (slug);


--
-- Name: booking_calendars_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_calendars_date ON public."BookingCalendars" USING btree (date);


--
-- Name: booking_calendars_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_calendars_deleted_at ON public."BookingCalendars" USING btree ("deletedAt");


--
-- Name: booking_calendars_is_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_calendars_is_available ON public."BookingCalendars" USING btree ("isAvailable");


--
-- Name: booking_calendars_listing_id_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX booking_calendars_listing_id_date ON public."BookingCalendars" USING btree ("listingId", date);


--
-- Name: booking_cancellations_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX booking_cancellations_booking_id ON public."BookingCancellations" USING btree ("bookingId");


--
-- Name: booking_cancellations_cancellation_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_cancellations_cancellation_date ON public."BookingCancellations" USING btree ("cancellationDate");


--
-- Name: booking_cancellations_cancelled_by_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_cancellations_cancelled_by_id ON public."BookingCancellations" USING btree ("cancelledById");


--
-- Name: booking_cancellations_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_cancellations_deleted_at ON public."BookingCancellations" USING btree ("deletedAt");


--
-- Name: booking_cancellations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_cancellations_status ON public."BookingCancellations" USING btree (status);


--
-- Name: booking_cancelled_by_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_cancelled_by_status_idx ON public."Bookings" USING btree ("cancelledBy", status);


--
-- Name: booking_changes_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_changes_booking_id ON public."BookingChanges" USING btree ("bookingId");


--
-- Name: booking_changes_change_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_changes_change_date ON public."BookingChanges" USING btree ("changeDate");


--
-- Name: booking_changes_change_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_changes_change_type ON public."BookingChanges" USING btree ("changeType");


--
-- Name: booking_changes_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_changes_deleted_at ON public."BookingChanges" USING btree ("deletedAt");


--
-- Name: booking_changes_requested_by_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_changes_requested_by_id ON public."BookingChanges" USING btree ("requestedById");


--
-- Name: booking_changes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_changes_status ON public."BookingChanges" USING btree (status);


--
-- Name: booking_request_date_range_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_request_date_range_idx ON public."BookingRequests" USING gist (tsrange(("checkIn")::timestamp without time zone, ("checkOut")::timestamp without time zone, '[]'::text));


--
-- Name: booking_request_dates_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_request_dates_idx ON public."BookingRequests" USING btree ("listingId", "checkIn", "checkOut");


--
-- Name: booking_requests_check_in; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_check_in ON public."BookingRequests" USING btree ("checkIn");


--
-- Name: booking_requests_check_out; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_check_out ON public."BookingRequests" USING btree ("checkOut");


--
-- Name: booking_requests_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_deleted_at ON public."BookingRequests" USING btree ("deletedAt");


--
-- Name: booking_requests_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_expires_at ON public."BookingRequests" USING btree ("expiresAt");


--
-- Name: booking_requests_guest_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_guest_id ON public."BookingRequests" USING btree ("guestId");


--
-- Name: booking_requests_host_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_host_id ON public."BookingRequests" USING btree ("hostId");


--
-- Name: booking_requests_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_listing_id ON public."BookingRequests" USING btree ("listingId");


--
-- Name: booking_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX booking_requests_status ON public."BookingRequests" USING btree (status);


--
-- Name: bookings_check_in; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_check_in ON public."Bookings" USING btree ("checkIn");


--
-- Name: bookings_check_out; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_check_out ON public."Bookings" USING btree ("checkOut");


--
-- Name: bookings_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_deleted_at ON public."Bookings" USING btree ("deletedAt");


--
-- Name: bookings_guest_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_guest_id ON public."Bookings" USING btree ("guestId");


--
-- Name: bookings_host_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_host_id ON public."Bookings" USING btree ("hostId");


--
-- Name: bookings_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_listing_id ON public."Bookings" USING btree ("listingId");


--
-- Name: bookings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_status ON public."Bookings" USING btree (status);


--
-- Name: categories_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_deleted_at ON public."Categories" USING btree ("deletedAt");


--
-- Name: categories_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_is_active ON public."Categories" USING btree ("isActive");


--
-- Name: categories_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_name ON public."Categories" USING btree (name);


--
-- Name: categories_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX categories_parent_id ON public."Categories" USING btree ("parentId");


--
-- Name: categories_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX categories_slug ON public."Categories" USING btree (slug);


--
-- Name: click_count_entity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX click_count_entity_idx ON public."ClickCounts" USING btree ("entityType", "entityId");


--
-- Name: click_counts_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX click_counts_deleted_at ON public."ClickCounts" USING btree ("deletedAt");


--
-- Name: click_counts_device_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX click_counts_device_type ON public."ClickCounts" USING btree ("deviceType");


--
-- Name: click_counts_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX click_counts_is_active ON public."ClickCounts" USING btree ("isActive");


--
-- Name: click_counts_last_clicked_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX click_counts_last_clicked_at ON public."ClickCounts" USING btree ("lastClickedAt");


--
-- Name: click_counts_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX click_counts_source ON public."ClickCounts" USING btree (source);


--
-- Name: conversation_listing_status_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_listing_status_active_idx ON public."Conversations" USING btree ("listingId", status, "isActive");


--
-- Name: conversation_participant_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX conversation_participant_unique_idx ON public."ConversationParticipants" USING btree ("conversationId", "userId");


--
-- Name: conversation_participants_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_participants_conversation_id ON public."ConversationParticipants" USING btree ("conversationId");


--
-- Name: conversation_participants_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_participants_deleted_at ON public."ConversationParticipants" USING btree ("deletedAt");


--
-- Name: conversation_participants_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_participants_is_active ON public."ConversationParticipants" USING btree ("isActive");


--
-- Name: conversation_participants_last_read_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_participants_last_read_at ON public."ConversationParticipants" USING btree ("lastReadAt");


--
-- Name: conversation_participants_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_participants_role ON public."ConversationParticipants" USING btree (role);


--
-- Name: conversation_participants_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversation_participants_user_id ON public."ConversationParticipants" USING btree ("userId");


--
-- Name: conversations_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_deleted_at ON public."Conversations" USING btree ("deletedAt");


--
-- Name: conversations_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_is_active ON public."Conversations" USING btree ("isActive");


--
-- Name: conversations_last_message_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_last_message_at ON public."Conversations" USING btree ("lastMessageAt");


--
-- Name: conversations_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_listing_id ON public."Conversations" USING btree ("listingId");


--
-- Name: conversations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_status ON public."Conversations" USING btree (status);


--
-- Name: document_user_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX document_user_type_idx ON public."Documents" USING btree ("userId", type);


--
-- Name: documents_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_deleted_at ON public."Documents" USING btree ("deletedAt");


--
-- Name: documents_expiry_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_expiry_date ON public."Documents" USING btree ("expiryDate");


--
-- Name: documents_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_is_active ON public."Documents" USING btree ("isActive");


--
-- Name: documents_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_status ON public."Documents" USING btree (status);


--
-- Name: documents_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_type ON public."Documents" USING btree (type);


--
-- Name: documents_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_user_id ON public."Documents" USING btree ("userId");


--
-- Name: documents_verified_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_verified_at ON public."Documents" USING btree ("verifiedAt");


--
-- Name: guest_preferences_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_preferences_deleted_at ON public."GuestPreferences" USING btree ("deletedAt");


--
-- Name: guest_preferences_guest_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX guest_preferences_guest_profile_id ON public."GuestPreferences" USING btree ("guestProfileId");


--
-- Name: guest_preferences_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_preferences_is_active ON public."GuestPreferences" USING btree ("isActive");


--
-- Name: guest_profiles_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_profiles_deleted_at ON public."GuestProfiles" USING btree ("deletedAt");


--
-- Name: guest_profiles_display_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_profiles_display_name ON public."GuestProfiles" USING btree ("displayName");


--
-- Name: guest_profiles_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_profiles_is_active ON public."GuestProfiles" USING btree ("isActive");


--
-- Name: guest_profiles_is_verified; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_profiles_is_verified ON public."GuestProfiles" USING btree ("isVerified");


--
-- Name: guest_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX guest_profiles_user_id ON public."GuestProfiles" USING btree ("userId");


--
-- Name: guest_profiles_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_profiles_verification_status ON public."GuestProfiles" USING btree ("verificationStatus");


--
-- Name: guest_verifications_document_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_verifications_document_type ON public."GuestVerifications" USING btree ("documentType");


--
-- Name: guest_verifications_guest_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_verifications_guest_profile_id ON public."GuestVerifications" USING btree ("guestProfileId");


--
-- Name: guest_verifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_verifications_status ON public."GuestVerifications" USING btree (status);


--
-- Name: guest_verifications_verified_by_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX guest_verifications_verified_by_id ON public."GuestVerifications" USING btree ("verifiedById");


--
-- Name: host_earnings_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_booking_id ON public."HostEarnings" USING btree ("bookingId");


--
-- Name: host_earnings_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_deleted_at ON public."HostEarnings" USING btree ("deletedAt");


--
-- Name: host_earnings_host_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_host_profile_id ON public."HostEarnings" USING btree ("hostProfileId");


--
-- Name: host_earnings_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_is_active ON public."HostEarnings" USING btree ("isActive");


--
-- Name: host_earnings_is_active_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_is_active_deleted_at ON public."HostEarnings" USING btree ("isActive", "deletedAt");


--
-- Name: host_earnings_paid_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_paid_at ON public."HostEarnings" USING btree ("paidAt");


--
-- Name: host_earnings_processed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_processed_at ON public."HostEarnings" USING btree ("processedAt");


--
-- Name: host_earnings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_status ON public."HostEarnings" USING btree (status);


--
-- Name: host_earnings_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_earnings_type ON public."HostEarnings" USING btree (type);


--
-- Name: host_profiles_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_profiles_deleted_at ON public."HostProfiles" USING btree ("deletedAt");


--
-- Name: host_profiles_display_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_profiles_display_name ON public."HostProfiles" USING btree ("displayName");


--
-- Name: host_profiles_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_profiles_is_active ON public."HostProfiles" USING btree ("isActive");


--
-- Name: host_profiles_is_active_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_profiles_is_active_deleted_at ON public."HostProfiles" USING btree ("isActive", "deletedAt");


--
-- Name: host_profiles_is_superhost; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_profiles_is_superhost ON public."HostProfiles" USING btree ("isSuperhost");


--
-- Name: host_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX host_profiles_user_id ON public."HostProfiles" USING btree ("userId");


--
-- Name: host_profiles_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_profiles_verification_status ON public."HostProfiles" USING btree ("verificationStatus");


--
-- Name: host_verifications_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_deleted_at ON public."HostVerifications" USING btree ("deletedAt");


--
-- Name: host_verifications_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_expires_at ON public."HostVerifications" USING btree ("expiresAt");


--
-- Name: host_verifications_host_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_host_id ON public."HostVerifications" USING btree ("hostId");


--
-- Name: host_verifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_is_active ON public."HostVerifications" USING btree ("isActive");


--
-- Name: host_verifications_is_active_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_is_active_deleted_at ON public."HostVerifications" USING btree ("isActive", "deletedAt");


--
-- Name: host_verifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_status ON public."HostVerifications" USING btree (status);


--
-- Name: host_verifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_type ON public."HostVerifications" USING btree (type);


--
-- Name: host_verifications_verified_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX host_verifications_verified_at ON public."HostVerifications" USING btree ("verifiedAt");


--
-- Name: listing_amenities_amenity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listing_amenities_amenity_id ON public.listing_amenities USING btree ("amenityId");


--
-- Name: listing_amenities_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listing_amenities_listing_id ON public.listing_amenities USING btree ("listingId");


--
-- Name: listing_amenity_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX listing_amenity_unique_idx ON public.listing_amenities USING btree ("listingId", "amenityId");


--
-- Name: listing_date_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX listing_date_unique_idx ON public."PropertyAvailabilities" USING btree ("listingId", date);


--
-- Name: listing_policy_type_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX listing_policy_type_unique_idx ON public."PropertyPolicies" USING btree ("listingId", type);


--
-- Name: listing_rule_type_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX listing_rule_type_unique_idx ON public."PropertyRules" USING btree ("listingId", type);


--
-- Name: listings_average_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_average_rating ON public."Listings" USING btree ("averageRating");


--
-- Name: listings_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_category_id ON public."Listings" USING btree ("categoryId");


--
-- Name: listings_host_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_host_id ON public."Listings" USING btree ("hostId");


--
-- Name: listings_instant_bookable; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_instant_bookable ON public."Listings" USING btree ("instantBookable");


--
-- Name: listings_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_is_active ON public."Listings" USING btree ("isActive");


--
-- Name: listings_price_per_night; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_price_per_night ON public."Listings" USING btree ("pricePerNight");


--
-- Name: listings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX listings_status ON public."Listings" USING btree (status);


--
-- Name: locations_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX locations_deleted_at ON public."Locations" USING btree ("deletedAt");


--
-- Name: locations_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX locations_is_active ON public."Locations" USING btree ("isActive");


--
-- Name: locations_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX locations_name ON public."Locations" USING btree (name);


--
-- Name: locations_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX locations_parent_id ON public."Locations" USING btree ("parentId");


--
-- Name: locations_parent_id_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX locations_parent_id_is_active ON public."Locations" USING btree ("parentId", "isActive");


--
-- Name: locations_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX locations_slug ON public."Locations" USING btree (slug);


--
-- Name: maintenances_created_by_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_created_by_id ON public."Maintenances" USING btree ("createdById");


--
-- Name: maintenances_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_deleted_at ON public."Maintenances" USING btree ("deletedAt");


--
-- Name: maintenances_end_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_end_time ON public."Maintenances" USING btree ("endTime");


--
-- Name: maintenances_impact; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_impact ON public."Maintenances" USING btree (impact);


--
-- Name: maintenances_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_is_active ON public."Maintenances" USING btree ("isActive");


--
-- Name: maintenances_start_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_start_time ON public."Maintenances" USING btree ("startTime");


--
-- Name: maintenances_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_status ON public."Maintenances" USING btree (status);


--
-- Name: maintenances_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX maintenances_type ON public."Maintenances" USING btree (type);


--
-- Name: message_attachments_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX message_attachments_deleted_at ON public."MessageAttachments" USING btree ("deletedAt");


--
-- Name: message_attachments_file_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX message_attachments_file_type ON public."MessageAttachments" USING btree ("fileType");


--
-- Name: message_attachments_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX message_attachments_is_active ON public."MessageAttachments" USING btree ("isActive");


--
-- Name: message_attachments_message_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX message_attachments_message_id ON public."MessageAttachments" USING btree ("messageId");


--
-- Name: messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_conversation_id ON public."Messages" USING btree ("conversationId");


--
-- Name: messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_created_at ON public."Messages" USING btree ("createdAt");


--
-- Name: messages_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_deleted_at ON public."Messages" USING btree ("deletedAt");


--
-- Name: messages_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_is_active ON public."Messages" USING btree ("isActive");


--
-- Name: messages_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_is_read ON public."Messages" USING btree ("isRead");


--
-- Name: messages_read_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_read_at ON public."Messages" USING btree ("readAt");


--
-- Name: messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_sender_id ON public."Messages" USING btree ("senderId");


--
-- Name: notifications_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_category ON public."Notifications" USING btree (category);


--
-- Name: notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_created_at ON public."Notifications" USING btree ("createdAt");


--
-- Name: notifications_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_deleted_at ON public."Notifications" USING btree ("deletedAt");


--
-- Name: notifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_is_active ON public."Notifications" USING btree ("isActive");


--
-- Name: notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_is_read ON public."Notifications" USING btree ("isRead");


--
-- Name: notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_type ON public."Notifications" USING btree (type);


--
-- Name: notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_id ON public."Notifications" USING btree ("userId");


--
-- Name: payments_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_booking_id ON public."Payments" USING btree ("bookingId");


--
-- Name: payments_completed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_completed_at ON public."Payments" USING btree ("completedAt");


--
-- Name: payments_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_deleted_at ON public."Payments" USING btree ("deletedAt");


--
-- Name: payments_idempotency_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payments_idempotency_key ON public."Payments" USING btree ("idempotencyKey");


--
-- Name: payments_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_is_active ON public."Payments" USING btree ("isActive");


--
-- Name: payments_payment_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_payment_method ON public."Payments" USING btree ("paymentMethod");


--
-- Name: payments_processed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_processed_at ON public."Payments" USING btree ("processedAt");


--
-- Name: payments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_status ON public."Payments" USING btree (status);


--
-- Name: payout_accounts_account_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payout_accounts_account_type ON public."PayoutAccounts" USING btree ("accountType");


--
-- Name: payout_accounts_default_per_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX payout_accounts_default_per_host ON public."PayoutAccounts" USING btree ("hostProfileId") WHERE ("isDefault" = true);


--
-- Name: payout_accounts_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payout_accounts_deleted_at ON public."PayoutAccounts" USING btree ("deletedAt");


--
-- Name: payout_accounts_host_profile_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payout_accounts_host_profile_id ON public."PayoutAccounts" USING btree ("hostProfileId");


--
-- Name: payout_accounts_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payout_accounts_is_active ON public."PayoutAccounts" USING btree ("isActive");


--
-- Name: payout_accounts_is_verified; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payout_accounts_is_verified ON public."PayoutAccounts" USING btree ("isVerified");


--
-- Name: photos_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_category ON public."Photos" USING btree (category);


--
-- Name: photos_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_deleted_at ON public."Photos" USING btree ("deletedAt");


--
-- Name: photos_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_display_order ON public."Photos" USING btree ("displayOrder");


--
-- Name: photos_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_is_active ON public."Photos" USING btree ("isActive");


--
-- Name: photos_is_cover; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_is_cover ON public."Photos" USING btree ("isCover");


--
-- Name: photos_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_listing_id ON public."Photos" USING btree ("listingId");


--
-- Name: photos_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_status ON public."Photos" USING btree (status);


--
-- Name: photos_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX photos_tags ON public."Photos" USING gin (tags);


--
-- Name: price_rules_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rules_deleted_at ON public."PriceRules" USING btree ("deletedAt");


--
-- Name: price_rules_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rules_end_date ON public."PriceRules" USING btree ("endDate");


--
-- Name: price_rules_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rules_is_active ON public."PriceRules" USING btree ("isActive");


--
-- Name: price_rules_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rules_listing_id ON public."PriceRules" USING btree ("listingId");


--
-- Name: price_rules_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rules_priority ON public."PriceRules" USING btree (priority);


--
-- Name: price_rules_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rules_start_date ON public."PriceRules" USING btree ("startDate");


--
-- Name: price_rules_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX price_rules_type ON public."PriceRules" USING btree (type);


--
-- Name: property_availabilities_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_availabilities_date ON public."PropertyAvailabilities" USING btree (date);


--
-- Name: property_availabilities_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_availabilities_deleted_at ON public."PropertyAvailabilities" USING btree ("deletedAt");


--
-- Name: property_availabilities_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_availabilities_is_active ON public."PropertyAvailabilities" USING btree ("isActive");


--
-- Name: property_availabilities_is_available; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_availabilities_is_available ON public."PropertyAvailabilities" USING btree ("isAvailable");


--
-- Name: property_availabilities_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_availabilities_listing_id ON public."PropertyAvailabilities" USING btree ("listingId");


--
-- Name: property_availabilities_price; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_availabilities_price ON public."PropertyAvailabilities" USING btree (price);


--
-- Name: property_policies_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_policies_deleted_at ON public."PropertyPolicies" USING btree ("deletedAt");


--
-- Name: property_policies_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_policies_display_order ON public."PropertyPolicies" USING btree ("displayOrder");


--
-- Name: property_policies_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_policies_is_active ON public."PropertyPolicies" USING btree ("isActive");


--
-- Name: property_policies_is_active_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_policies_is_active_deleted_at ON public."PropertyPolicies" USING btree ("isActive", "deletedAt");


--
-- Name: property_policies_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_policies_listing_id ON public."PropertyPolicies" USING btree ("listingId");


--
-- Name: property_policies_requires_agreement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_policies_requires_agreement ON public."PropertyPolicies" USING btree ("requiresAgreement");


--
-- Name: property_policies_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_policies_type ON public."PropertyPolicies" USING btree (type);


--
-- Name: property_rules_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_rules_deleted_at ON public."PropertyRules" USING btree ("deletedAt");


--
-- Name: property_rules_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_rules_display_order ON public."PropertyRules" USING btree ("displayOrder");


--
-- Name: property_rules_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_rules_is_active ON public."PropertyRules" USING btree ("isActive");


--
-- Name: property_rules_is_active_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_rules_is_active_deleted_at ON public."PropertyRules" USING btree ("isActive", "deletedAt");


--
-- Name: property_rules_is_allowed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_rules_is_allowed ON public."PropertyRules" USING btree ("isAllowed");


--
-- Name: property_rules_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_rules_listing_id ON public."PropertyRules" USING btree ("listingId");


--
-- Name: property_rules_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_rules_type ON public."PropertyRules" USING btree (type);


--
-- Name: property_types_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX property_types_is_active ON public."PropertyTypes" USING btree ("isActive");


--
-- Name: property_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX property_types_name ON public."PropertyTypes" USING btree (name);


--
-- Name: property_types_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX property_types_slug ON public."PropertyTypes" USING btree (slug);


--
-- Name: report_unique_per_listing; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX report_unique_per_listing ON public."Reports" USING btree ("reporterId", "listingId", type);


--
-- Name: report_unique_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX report_unique_per_user ON public."Reports" USING btree ("reporterId", "reportedUserId", type);


--
-- Name: reports_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_listing_id ON public."Reports" USING btree ("listingId");


--
-- Name: reports_reported_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_reported_user_id ON public."Reports" USING btree ("reportedUserId");


--
-- Name: reports_reporter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_reporter_id ON public."Reports" USING btree ("reporterId");


--
-- Name: reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_status ON public."Reports" USING btree (status);


--
-- Name: reports_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reports_type ON public."Reports" USING btree (type);


--
-- Name: review_report_unique_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX review_report_unique_per_user ON public."ReviewReports" USING btree ("reviewId", "reporterId");


--
-- Name: review_reports_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_reports_deleted_at ON public."ReviewReports" USING btree ("deletedAt");


--
-- Name: review_reports_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_reports_is_active ON public."ReviewReports" USING btree ("isActive");


--
-- Name: review_reports_reporter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_reports_reporter_id ON public."ReviewReports" USING btree ("reporterId");


--
-- Name: review_reports_resolved_by_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_reports_resolved_by_id ON public."ReviewReports" USING btree ("resolvedById");


--
-- Name: review_reports_review_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_reports_review_id ON public."ReviewReports" USING btree ("reviewId");


--
-- Name: review_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_reports_status ON public."ReviewReports" USING btree (status);


--
-- Name: review_responses_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_responses_deleted_at ON public."ReviewResponses" USING btree ("deletedAt");


--
-- Name: review_responses_host_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_responses_host_id ON public."ReviewResponses" USING btree ("hostId");


--
-- Name: review_responses_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_responses_is_active ON public."ReviewResponses" USING btree ("isActive");


--
-- Name: review_responses_is_public; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX review_responses_is_public ON public."ReviewResponses" USING btree ("isPublic");


--
-- Name: review_responses_review_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX review_responses_review_id ON public."ReviewResponses" USING btree ("reviewId");


--
-- Name: reviews_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_booking_id ON public."Reviews" USING btree ("bookingId");


--
-- Name: reviews_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_deleted_at ON public."Reviews" USING btree ("deletedAt");


--
-- Name: reviews_is_public; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_is_public ON public."Reviews" USING btree ("isPublic");


--
-- Name: reviews_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_rating ON public."Reviews" USING btree (rating);


--
-- Name: reviews_reviewed_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_reviewed_id ON public."Reviews" USING btree ("reviewedId");


--
-- Name: reviews_reviewer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_reviewer_id ON public."Reviews" USING btree ("reviewerId");


--
-- Name: reviews_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reviews_type ON public."Reviews" USING btree (type);


--
-- Name: room_types_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX room_types_deleted_at ON public."RoomTypes" USING btree ("deletedAt");


--
-- Name: room_types_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX room_types_is_active ON public."RoomTypes" USING btree ("isActive");


--
-- Name: room_types_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX room_types_name ON public."RoomTypes" USING btree (name);


--
-- Name: room_types_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX room_types_slug ON public."RoomTypes" USING btree (slug);


--
-- Name: search_filters_default_per_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX search_filters_default_per_user ON public."SearchFilters" USING btree ("userId") WHERE ("isDefault" = true);


--
-- Name: search_filters_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_filters_deleted_at ON public."SearchFilters" USING btree ("deletedAt");


--
-- Name: search_filters_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_filters_is_active ON public."SearchFilters" USING btree ("isActive");


--
-- Name: search_filters_is_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_filters_is_default ON public."SearchFilters" USING btree ("isDefault");


--
-- Name: search_filters_last_used_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_filters_last_used_at ON public."SearchFilters" USING btree ("lastUsedAt");


--
-- Name: search_filters_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_filters_user_id ON public."SearchFilters" USING btree ("userId");


--
-- Name: search_histories_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_histories_created_at ON public."SearchHistories" USING btree ("createdAt");


--
-- Name: search_histories_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_histories_deleted_at ON public."SearchHistories" USING btree ("deletedAt");


--
-- Name: search_histories_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_histories_is_active ON public."SearchHistories" USING btree ("isActive");


--
-- Name: search_histories_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_histories_session_id ON public."SearchHistories" USING btree ("sessionId");


--
-- Name: search_histories_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX search_histories_user_id ON public."SearchHistories" USING btree ("userId");


--
-- Name: seasonal_pricing_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seasonal_pricing_deleted_at ON public."SeasonalPricing" USING btree ("deletedAt");


--
-- Name: seasonal_pricing_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seasonal_pricing_end_date ON public."SeasonalPricing" USING btree ("endDate");


--
-- Name: seasonal_pricing_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seasonal_pricing_is_active ON public."SeasonalPricing" USING btree ("isActive");


--
-- Name: seasonal_pricing_listing_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seasonal_pricing_listing_id ON public."SeasonalPricing" USING btree ("listingId");


--
-- Name: seasonal_pricing_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seasonal_pricing_priority ON public."SeasonalPricing" USING btree (priority);


--
-- Name: seasonal_pricing_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX seasonal_pricing_start_date ON public."SeasonalPricing" USING btree ("startDate");


--
-- Name: system_settings_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX system_settings_category ON public."SystemSettings" USING btree (category);


--
-- Name: system_settings_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX system_settings_deleted_at ON public."SystemSettings" USING btree ("deletedAt");


--
-- Name: system_settings_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX system_settings_is_active ON public."SystemSettings" USING btree ("isActive");


--
-- Name: system_settings_is_public; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX system_settings_is_public ON public."SystemSettings" USING btree ("isPublic");


--
-- Name: system_settings_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX system_settings_key ON public."SystemSettings" USING btree (key);


--
-- Name: system_settings_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX system_settings_type ON public."SystemSettings" USING btree (type);


--
-- Name: user_roles_user_id_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX user_roles_user_id_role_id ON public.user_roles USING btree ("userId", "roleId");


--
-- Name: users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email ON public."Users" USING btree (email);


--
-- Name: users_last_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_last_activity ON public."Users" USING btree ("lastActivity");


--
-- Name: users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_status ON public."Users" USING btree (status);


--
-- Name: verification_user_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_user_type_idx ON public."Verifications" USING btree ("userId", type);


--
-- Name: verifications_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_code ON public."Verifications" USING btree (code);


--
-- Name: verifications_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_deleted_at ON public."Verifications" USING btree ("deletedAt");


--
-- Name: verifications_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_expires_at ON public."Verifications" USING btree ("expiresAt");


--
-- Name: verifications_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_is_active ON public."Verifications" USING btree ("isActive");


--
-- Name: verifications_method; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_method ON public."Verifications" USING btree (method);


--
-- Name: verifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_status ON public."Verifications" USING btree (status);


--
-- Name: verifications_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_token ON public."Verifications" USING btree (token);


--
-- Name: verifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_type ON public."Verifications" USING btree (type);


--
-- Name: verifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verifications_user_id ON public."Verifications" USING btree ("userId");


--
-- Name: view_count_entity_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX view_count_entity_idx ON public."ViewCounts" USING btree ("entityType", "entityId");


--
-- Name: view_counts_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX view_counts_deleted_at ON public."ViewCounts" USING btree ("deletedAt");


--
-- Name: view_counts_device_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX view_counts_device_type ON public."ViewCounts" USING btree ("deviceType");


--
-- Name: view_counts_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX view_counts_is_active ON public."ViewCounts" USING btree ("isActive");


--
-- Name: view_counts_last_viewed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX view_counts_last_viewed_at ON public."ViewCounts" USING btree ("lastViewedAt");


--
-- Name: view_counts_source; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX view_counts_source ON public."ViewCounts" USING btree (source);


--
-- Name: Amenities Amenities_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Amenities"
    ADD CONSTRAINT "Amenities_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Amenities"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BookingCalendars BookingCalendars_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCalendars"
    ADD CONSTRAINT "BookingCalendars_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BookingCancellations BookingCancellations_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCancellations"
    ADD CONSTRAINT "BookingCancellations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Bookings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BookingCancellations BookingCancellations_cancelledById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCancellations"
    ADD CONSTRAINT "BookingCancellations_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BookingCancellations BookingCancellations_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingCancellations"
    ADD CONSTRAINT "BookingCancellations_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BookingChanges BookingChanges_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingChanges"
    ADD CONSTRAINT "BookingChanges_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Bookings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BookingChanges BookingChanges_requestedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingChanges"
    ADD CONSTRAINT "BookingChanges_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BookingChanges BookingChanges_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingChanges"
    ADD CONSTRAINT "BookingChanges_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BookingRequests BookingRequests_guestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingRequests"
    ADD CONSTRAINT "BookingRequests_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BookingRequests BookingRequests_hostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingRequests"
    ADD CONSTRAINT "BookingRequests_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BookingRequests BookingRequests_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingRequests"
    ADD CONSTRAINT "BookingRequests_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BookingRequests BookingRequests_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BookingRequests"
    ADD CONSTRAINT "BookingRequests_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bookings Bookings_cancelledBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bookings Bookings_guestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bookings Bookings_hostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bookings Bookings_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bookings Bookings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bookings"
    ADD CONSTRAINT "Bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Categories Categories_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Categories"
    ADD CONSTRAINT "Categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Categories"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ClickCounts ClickCounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClickCounts"
    ADD CONSTRAINT "ClickCounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ConversationParticipants ConversationParticipants_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationParticipants"
    ADD CONSTRAINT "ConversationParticipants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ConversationParticipants ConversationParticipants_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ConversationParticipants"
    ADD CONSTRAINT "ConversationParticipants_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversations Conversations_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversations"
    ADD CONSTRAINT "Conversations_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversations Conversations_userA_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversations"
    ADD CONSTRAINT "Conversations_userA_fkey" FOREIGN KEY ("userA") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversations Conversations_userB_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversations"
    ADD CONSTRAINT "Conversations_userB_fkey" FOREIGN KEY ("userB") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Documents Documents_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documents"
    ADD CONSTRAINT "Documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Documents Documents_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Documents"
    ADD CONSTRAINT "Documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GuestPreferences GuestPreferences_guestProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestPreferences"
    ADD CONSTRAINT "GuestPreferences_guestProfileId_fkey" FOREIGN KEY ("guestProfileId") REFERENCES public."GuestProfiles"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuestPreferences GuestPreferences_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestPreferences"
    ADD CONSTRAINT "GuestPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GuestProfiles GuestProfiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestProfiles"
    ADD CONSTRAINT "GuestProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuestVerifications GuestVerifications_guestProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestVerifications"
    ADD CONSTRAINT "GuestVerifications_guestProfileId_fkey" FOREIGN KEY ("guestProfileId") REFERENCES public."GuestProfiles"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GuestVerifications GuestVerifications_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GuestVerifications"
    ADD CONSTRAINT "GuestVerifications_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HostEarnings HostEarnings_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostEarnings"
    ADD CONSTRAINT "HostEarnings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Bookings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HostEarnings HostEarnings_hostProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostEarnings"
    ADD CONSTRAINT "HostEarnings_hostProfileId_fkey" FOREIGN KEY ("hostProfileId") REFERENCES public."HostProfiles"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HostEarnings HostEarnings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostEarnings"
    ADD CONSTRAINT "HostEarnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HostProfiles HostProfiles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostProfiles"
    ADD CONSTRAINT "HostProfiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HostVerifications HostVerifications_hostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostVerifications"
    ADD CONSTRAINT "HostVerifications_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HostVerifications HostVerifications_rejectedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostVerifications"
    ADD CONSTRAINT "HostVerifications_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HostVerifications HostVerifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostVerifications"
    ADD CONSTRAINT "HostVerifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: HostVerifications HostVerifications_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."HostVerifications"
    ADD CONSTRAINT "HostVerifications_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Listings Listings_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Categories"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Listings Listings_hostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Listings Listings_hostProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_hostProfileId_fkey" FOREIGN KEY ("hostProfileId") REFERENCES public."HostProfiles"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Listings Listings_locationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES public."Locations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Listings Listings_propertyTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_propertyTypeId_fkey" FOREIGN KEY ("propertyTypeId") REFERENCES public."PropertyTypes"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Listings Listings_roomTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Listings"
    ADD CONSTRAINT "Listings_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES public."RoomTypes"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Locations Locations_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Locations"
    ADD CONSTRAINT "Locations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Locations"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Maintenances Maintenances_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenances"
    ADD CONSTRAINT "Maintenances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."Users"(id) ON UPDATE CASCADE;


--
-- Name: Maintenances Maintenances_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Maintenances"
    ADD CONSTRAINT "Maintenances_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MessageAttachments MessageAttachments_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachments"
    ADD CONSTRAINT "MessageAttachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Messages"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageAttachments MessageAttachments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachments"
    ADD CONSTRAINT "MessageAttachments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Messages Messages_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Bookings"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Messages Messages_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversations"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Messages Messages_receiverId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Messages Messages_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Messages"
    ADD CONSTRAINT "Messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notifications Notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notifications"
    ADD CONSTRAINT "Notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payments Payments_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Bookings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payments Payments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payments"
    ADD CONSTRAINT "Payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayoutAccounts PayoutAccounts_hostProfileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutAccounts"
    ADD CONSTRAINT "PayoutAccounts_hostProfileId_fkey" FOREIGN KEY ("hostProfileId") REFERENCES public."HostProfiles"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayoutAccounts PayoutAccounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayoutAccounts"
    ADD CONSTRAINT "PayoutAccounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Photos Photos_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Photos"
    ADD CONSTRAINT "Photos_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PriceRules PriceRules_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PriceRules"
    ADD CONSTRAINT "PriceRules_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PropertyAvailabilities PropertyAvailabilities_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyAvailabilities"
    ADD CONSTRAINT "PropertyAvailabilities_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PropertyPolicies PropertyPolicies_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyPolicies"
    ADD CONSTRAINT "PropertyPolicies_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PropertyRules PropertyRules_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyRules"
    ADD CONSTRAINT "PropertyRules_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reports Reports_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reports"
    ADD CONSTRAINT "Reports_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reports Reports_reportedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reports"
    ADD CONSTRAINT "Reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reports Reports_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reports"
    ADD CONSTRAINT "Reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reports Reports_resolvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reports"
    ADD CONSTRAINT "Reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReviewReports ReviewReports_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewReports"
    ADD CONSTRAINT "ReviewReports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReviewReports ReviewReports_resolvedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewReports"
    ADD CONSTRAINT "ReviewReports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReviewReports ReviewReports_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewReports"
    ADD CONSTRAINT "ReviewReports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public."Reviews"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReviewReports ReviewReports_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewReports"
    ADD CONSTRAINT "ReviewReports_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ReviewResponses ReviewResponses_hostId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewResponses"
    ADD CONSTRAINT "ReviewResponses_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReviewResponses ReviewResponses_reviewId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewResponses"
    ADD CONSTRAINT "ReviewResponses_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES public."Reviews"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReviewResponses ReviewResponses_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewResponses"
    ADD CONSTRAINT "ReviewResponses_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reviews Reviews_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Bookings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reviews Reviews_guestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES public."GuestProfiles"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reviews Reviews_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reviews Reviews_reviewedId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reviews Reviews_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reviews Reviews_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Reviews"
    ADD CONSTRAINT "Reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SearchFilters SearchFilters_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SearchFilters"
    ADD CONSTRAINT "SearchFilters_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SearchHistories SearchHistories_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SearchHistories"
    ADD CONSTRAINT "SearchHistories_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SeasonalPricing SeasonalPricing_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SeasonalPricing"
    ADD CONSTRAINT "SeasonalPricing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Users Users_referredBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Verifications Verifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Verifications"
    ADD CONSTRAINT "Verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Verifications Verifications_verifiedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Verifications"
    ADD CONSTRAINT "Verifications_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ViewCounts ViewCounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ViewCounts"
    ADD CONSTRAINT "ViewCounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: listing_amenities listing_amenities_amenityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_amenities
    ADD CONSTRAINT "listing_amenities_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES public."Amenities"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: listing_amenities listing_amenities_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listing_amenities
    ADD CONSTRAINT "listing_amenities_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listings"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

