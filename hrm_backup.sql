--
-- PostgreSQL database dump
--

\restrict bf2Tq9Xe8LWWGkqmmW7h6nEvMQQXog9Q2KbXUxb591OvqTSKsdc3iCz7jMKroVM

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

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

ALTER TABLE IF EXISTS ONLY public."RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public."RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_permissionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Relative" DROP CONSTRAINT IF EXISTS "Relative_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."PreOnboardingProfile" DROP CONSTRAINT IF EXISTS "PreOnboardingProfile_candidateId_fkey";
ALTER TABLE IF EXISTS ONLY public."Position" DROP CONSTRAINT IF EXISTS "Position_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public."PerformanceReview" DROP CONSTRAINT IF EXISTS "PerformanceReview_reviewCycleId_fkey";
ALTER TABLE IF EXISTS ONLY public."PerformanceReview" DROP CONSTRAINT IF EXISTS "PerformanceReview_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payslip" DROP CONSTRAINT IF EXISTS "Payslip_payrollPeriodId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payslip" DROP CONSTRAINT IF EXISTS "Payslip_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."PayslipDetail" DROP CONSTRAINT IF EXISTS "PayslipDetail_payslipId_fkey";
ALTER TABLE IF EXISTS ONLY public."OnboardingTask" DROP CONSTRAINT IF EXISTS "OnboardingTask_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."OTRequest" DROP CONSTRAINT IF EXISTS "OTRequest_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeaveRequest" DROP CONSTRAINT IF EXISTS "LeaveRequest_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeaveBalance" DROP CONSTRAINT IF EXISTS "LeaveBalance_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."KPI" DROP CONSTRAINT IF EXISTS "KPI_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobPosting" DROP CONSTRAINT IF EXISTS "JobPosting_positionId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobPosting" DROP CONSTRAINT IF EXISTS "JobPosting_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public."JobOffer" DROP CONSTRAINT IF EXISTS "JobOffer_candidateId_fkey";
ALTER TABLE IF EXISTS ONLY public."InterviewRound" DROP CONSTRAINT IF EXISTS "InterviewRound_candidateId_fkey";
ALTER TABLE IF EXISTS ONLY public."EmploymentHistory" DROP CONSTRAINT IF EXISTS "EmploymentHistory_positionId_fkey";
ALTER TABLE IF EXISTS ONLY public."EmploymentHistory" DROP CONSTRAINT IF EXISTS "EmploymentHistory_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."EmploymentHistory" DROP CONSTRAINT IF EXISTS "EmploymentHistory_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_positionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Department" DROP CONSTRAINT IF EXISTS "Department_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Degree" DROP CONSTRAINT IF EXISTS "Degree_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Decision" DROP CONSTRAINT IF EXISTS "Decision_newPositionId_fkey";
ALTER TABLE IF EXISTS ONLY public."Decision" DROP CONSTRAINT IF EXISTS "Decision_newDepartmentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Decision" DROP CONSTRAINT IF EXISTS "Decision_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Contract" DROP CONSTRAINT IF EXISTS "Contract_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Certificate" DROP CONSTRAINT IF EXISTS "Certificate_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Candidate" DROP CONSTRAINT IF EXISTS "Candidate_jobPostingId_fkey";
ALTER TABLE IF EXISTS ONLY public."CandidateFeedback" DROP CONSTRAINT IF EXISTS "CandidateFeedback_interviewRoundId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."AttendanceAdjustment" DROP CONSTRAINT IF EXISTS "AttendanceAdjustment_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."AssetAssignment" DROP CONSTRAINT IF EXISTS "AssetAssignment_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."AssetAssignment" DROP CONSTRAINT IF EXISTS "AssetAssignment_assetId_fkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_roleId_fkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_employeeId_fkey";
DROP INDEX IF EXISTS public."SystemSetting_key_key";
DROP INDEX IF EXISTS public."Role_name_key";
DROP INDEX IF EXISTS public."PreOnboardingProfile_candidateId_key";
DROP INDEX IF EXISTS public."Position_code_key";
DROP INDEX IF EXISTS public."Permission_action_key";
DROP INDEX IF EXISTS public."PayrollPeriod_monthYear_key";
DROP INDEX IF EXISTS public."LeaveTypeConfig_code_key";
DROP INDEX IF EXISTS public."JobOffer_candidateId_key";
DROP INDEX IF EXISTS public."Employee_email_key";
DROP INDEX IF EXISTS public."Employee_code_key";
DROP INDEX IF EXISTS public."Employee_cccd_key";
DROP INDEX IF EXISTS public."Department_code_key";
DROP INDEX IF EXISTS public."Decision_decisionNumber_key";
DROP INDEX IF EXISTS public."CandidateUser_email_key";
DROP INDEX IF EXISTS public."Asset_code_key";
DROP INDEX IF EXISTS public."Account_username_key";
DROP INDEX IF EXISTS public."Account_employeeId_key";
ALTER TABLE IF EXISTS ONLY public."TaxBracket" DROP CONSTRAINT IF EXISTS "TaxBracket_pkey";
ALTER TABLE IF EXISTS ONLY public."SystemSetting" DROP CONSTRAINT IF EXISTS "SystemSetting_pkey";
ALTER TABLE IF EXISTS ONLY public."Shift" DROP CONSTRAINT IF EXISTS "Shift_pkey";
ALTER TABLE IF EXISTS ONLY public."Role" DROP CONSTRAINT IF EXISTS "Role_pkey";
ALTER TABLE IF EXISTS ONLY public."RolePermission" DROP CONSTRAINT IF EXISTS "RolePermission_pkey";
ALTER TABLE IF EXISTS ONLY public."ReviewCycle" DROP CONSTRAINT IF EXISTS "ReviewCycle_pkey";
ALTER TABLE IF EXISTS ONLY public."Relative" DROP CONSTRAINT IF EXISTS "Relative_pkey";
ALTER TABLE IF EXISTS ONLY public."PreOnboardingProfile" DROP CONSTRAINT IF EXISTS "PreOnboardingProfile_pkey";
ALTER TABLE IF EXISTS ONLY public."Position" DROP CONSTRAINT IF EXISTS "Position_pkey";
ALTER TABLE IF EXISTS ONLY public."Permission" DROP CONSTRAINT IF EXISTS "Permission_pkey";
ALTER TABLE IF EXISTS ONLY public."PerformanceReview" DROP CONSTRAINT IF EXISTS "PerformanceReview_pkey";
ALTER TABLE IF EXISTS ONLY public."Payslip" DROP CONSTRAINT IF EXISTS "Payslip_pkey";
ALTER TABLE IF EXISTS ONLY public."PayslipDetail" DROP CONSTRAINT IF EXISTS "PayslipDetail_pkey";
ALTER TABLE IF EXISTS ONLY public."PayrollPeriod" DROP CONSTRAINT IF EXISTS "PayrollPeriod_pkey";
ALTER TABLE IF EXISTS ONLY public."OnboardingTask" DROP CONSTRAINT IF EXISTS "OnboardingTask_pkey";
ALTER TABLE IF EXISTS ONLY public."OTRequest" DROP CONSTRAINT IF EXISTS "OTRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."LeaveTypeConfig" DROP CONSTRAINT IF EXISTS "LeaveTypeConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."LeaveRequest" DROP CONSTRAINT IF EXISTS "LeaveRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."LeavePolicy" DROP CONSTRAINT IF EXISTS "LeavePolicy_pkey";
ALTER TABLE IF EXISTS ONLY public."LeaveBalance" DROP CONSTRAINT IF EXISTS "LeaveBalance_pkey";
ALTER TABLE IF EXISTS ONLY public."KPI" DROP CONSTRAINT IF EXISTS "KPI_pkey";
ALTER TABLE IF EXISTS ONLY public."KPITemplate" DROP CONSTRAINT IF EXISTS "KPITemplate_pkey";
ALTER TABLE IF EXISTS ONLY public."JobPosting" DROP CONSTRAINT IF EXISTS "JobPosting_pkey";
ALTER TABLE IF EXISTS ONLY public."JobOffer" DROP CONSTRAINT IF EXISTS "JobOffer_pkey";
ALTER TABLE IF EXISTS ONLY public."InterviewRound" DROP CONSTRAINT IF EXISTS "InterviewRound_pkey";
ALTER TABLE IF EXISTS ONLY public."Holiday" DROP CONSTRAINT IF EXISTS "Holiday_pkey";
ALTER TABLE IF EXISTS ONLY public."EmploymentHistory" DROP CONSTRAINT IF EXISTS "EmploymentHistory_pkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_pkey";
ALTER TABLE IF EXISTS ONLY public."Department" DROP CONSTRAINT IF EXISTS "Department_pkey";
ALTER TABLE IF EXISTS ONLY public."Degree" DROP CONSTRAINT IF EXISTS "Degree_pkey";
ALTER TABLE IF EXISTS ONLY public."Decision" DROP CONSTRAINT IF EXISTS "Decision_pkey";
ALTER TABLE IF EXISTS ONLY public."Contract" DROP CONSTRAINT IF EXISTS "Contract_pkey";
ALTER TABLE IF EXISTS ONLY public."Certificate" DROP CONSTRAINT IF EXISTS "Certificate_pkey";
ALTER TABLE IF EXISTS ONLY public."Candidate" DROP CONSTRAINT IF EXISTS "Candidate_pkey";
ALTER TABLE IF EXISTS ONLY public."CandidateUser" DROP CONSTRAINT IF EXISTS "CandidateUser_pkey";
ALTER TABLE IF EXISTS ONLY public."CandidateFeedback" DROP CONSTRAINT IF EXISTS "CandidateFeedback_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_pkey";
ALTER TABLE IF EXISTS ONLY public."AttendanceAdjustment" DROP CONSTRAINT IF EXISTS "AttendanceAdjustment_pkey";
ALTER TABLE IF EXISTS ONLY public."Asset" DROP CONSTRAINT IF EXISTS "Asset_pkey";
ALTER TABLE IF EXISTS ONLY public."AssetAssignment" DROP CONSTRAINT IF EXISTS "AssetAssignment_pkey";
ALTER TABLE IF EXISTS ONLY public."Allowance" DROP CONSTRAINT IF EXISTS "Allowance_pkey";
ALTER TABLE IF EXISTS ONLY public."Account" DROP CONSTRAINT IF EXISTS "Account_pkey";
DROP TABLE IF EXISTS public."TaxBracket";
DROP TABLE IF EXISTS public."SystemSetting";
DROP TABLE IF EXISTS public."Shift";
DROP TABLE IF EXISTS public."RolePermission";
DROP TABLE IF EXISTS public."Role";
DROP TABLE IF EXISTS public."ReviewCycle";
DROP TABLE IF EXISTS public."Relative";
DROP TABLE IF EXISTS public."PreOnboardingProfile";
DROP TABLE IF EXISTS public."Position";
DROP TABLE IF EXISTS public."Permission";
DROP TABLE IF EXISTS public."PerformanceReview";
DROP TABLE IF EXISTS public."PayslipDetail";
DROP TABLE IF EXISTS public."Payslip";
DROP TABLE IF EXISTS public."PayrollPeriod";
DROP TABLE IF EXISTS public."OnboardingTask";
DROP TABLE IF EXISTS public."OTRequest";
DROP TABLE IF EXISTS public."LeaveTypeConfig";
DROP TABLE IF EXISTS public."LeaveRequest";
DROP TABLE IF EXISTS public."LeavePolicy";
DROP TABLE IF EXISTS public."LeaveBalance";
DROP TABLE IF EXISTS public."KPITemplate";
DROP TABLE IF EXISTS public."KPI";
DROP TABLE IF EXISTS public."JobPosting";
DROP TABLE IF EXISTS public."JobOffer";
DROP TABLE IF EXISTS public."InterviewRound";
DROP TABLE IF EXISTS public."Holiday";
DROP TABLE IF EXISTS public."EmploymentHistory";
DROP TABLE IF EXISTS public."Employee";
DROP TABLE IF EXISTS public."Department";
DROP TABLE IF EXISTS public."Degree";
DROP TABLE IF EXISTS public."Decision";
DROP TABLE IF EXISTS public."Contract";
DROP TABLE IF EXISTS public."Certificate";
DROP TABLE IF EXISTS public."CandidateUser";
DROP TABLE IF EXISTS public."CandidateFeedback";
DROP TABLE IF EXISTS public."Candidate";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."AttendanceAdjustment";
DROP TABLE IF EXISTS public."Attendance";
DROP TABLE IF EXISTS public."AssetAssignment";
DROP TABLE IF EXISTS public."Asset";
DROP TABLE IF EXISTS public."Allowance";
DROP TABLE IF EXISTS public."Account";
DROP TYPE IF EXISTS public."RequestStatus";
DROP TYPE IF EXISTS public."PayrollStatus";
DROP TYPE IF EXISTS public."OfferStatus";
DROP TYPE IF EXISTS public."LeaveType";
DROP TYPE IF EXISTS public."EmployeeStatus";
DROP TYPE IF EXISTS public."DecisionType";
DROP TYPE IF EXISTS public."DecisionStatus";
DROP TYPE IF EXISTS public."ContractType";
DROP TYPE IF EXISTS public."ContractStatus";
DROP TYPE IF EXISTS public."CandidateStatus";
DROP TYPE IF EXISTS public."AttendanceStatus";
DROP TYPE IF EXISTS public."AssignmentStatus";
DROP TYPE IF EXISTS public."AssetStatus";
DROP TYPE IF EXISTS public."AssetCategory";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AssetCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssetCategory" AS ENUM (
    'LAPTOP',
    'DESKTOP',
    'MONITOR',
    'PHONE',
    'ACCESS_CARD',
    'OFFICE_EQUIPMENT',
    'VEHICLE',
    'OTHER'
);


ALTER TYPE public."AssetCategory" OWNER TO postgres;

--
-- Name: AssetStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssetStatus" AS ENUM (
    'AVAILABLE',
    'ASSIGNED',
    'MAINTENANCE',
    'DISPOSED'
);


ALTER TYPE public."AssetStatus" OWNER TO postgres;

--
-- Name: AssignmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AssignmentStatus" AS ENUM (
    'ACTIVE',
    'RETURNED',
    'DAMAGED'
);


ALTER TYPE public."AssignmentStatus" OWNER TO postgres;

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'NORMAL',
    'LATE',
    'ABSENT'
);


ALTER TYPE public."AttendanceStatus" OWNER TO postgres;

--
-- Name: CandidateStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CandidateStatus" AS ENUM (
    'SOURCED',
    'SCREENING',
    'INTERVIEWING',
    'OFFERING',
    'HIRED',
    'REJECTED',
    'APPLIED'
);


ALTER TYPE public."CandidateStatus" OWNER TO postgres;

--
-- Name: ContractStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContractStatus" AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'TERMINATED'
);


ALTER TYPE public."ContractStatus" OWNER TO postgres;

--
-- Name: ContractType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContractType" AS ENUM (
    'INTERNSHIP',
    'PROBATION',
    'OFFICIAL_1Y',
    'INDEFINITE'
);


ALTER TYPE public."ContractType" OWNER TO postgres;

--
-- Name: DecisionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DecisionStatus" AS ENUM (
    'DRAFT',
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."DecisionStatus" OWNER TO postgres;

--
-- Name: DecisionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DecisionType" AS ENUM (
    'SALARY_ADJUSTMENT',
    'PROMOTION',
    'TRANSFER',
    'TERMINATION',
    'REWARD',
    'DISCIPLINE'
);


ALTER TYPE public."DecisionType" OWNER TO postgres;

--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'ONBOARDING',
    'INTERNSHIP',
    'PROBATION',
    'ACTIVE',
    'RESIGNED'
);


ALTER TYPE public."EmployeeStatus" OWNER TO postgres;

--
-- Name: LeaveType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LeaveType" AS ENUM (
    'PAID',
    'UNPAID'
);


ALTER TYPE public."LeaveType" OWNER TO postgres;

--
-- Name: OfferStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OfferStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
);


ALTER TYPE public."OfferStatus" OWNER TO postgres;

--
-- Name: PayrollStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayrollStatus" AS ENUM (
    'DRAFT',
    'LOCKED'
);


ALTER TYPE public."PayrollStatus" OWNER TO postgres;

--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."RequestStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "employeeId" text,
    "roleId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: Allowance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Allowance" (
    id text NOT NULL,
    name text NOT NULL,
    amount numeric(65,30) NOT NULL,
    "isTaxable" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Allowance" OWNER TO postgres;

--
-- Name: Asset; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category public."AssetCategory" DEFAULT 'LAPTOP'::public."AssetCategory" NOT NULL,
    "serialNumber" text,
    price numeric(65,30) DEFAULT 0 NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    supplier text,
    status public."AssetStatus" DEFAULT 'AVAILABLE'::public."AssetStatus" NOT NULL,
    condition text DEFAULT 'Mới 100%'::text,
    location text DEFAULT 'Kho CNTT - Tầng 5'::text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Asset" OWNER TO postgres;

--
-- Name: AssetAssignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AssetAssignment" (
    id text NOT NULL,
    "assetId" text NOT NULL,
    "employeeId" text NOT NULL,
    "assignedDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "returnedDate" timestamp(3) without time zone,
    status public."AssignmentStatus" DEFAULT 'ACTIVE'::public."AssignmentStatus" NOT NULL,
    "conditionOnAssign" text DEFAULT 'Hoạt động tốt, nguyên tem bảo hành'::text,
    "conditionOnReturn" text,
    "handoverDocCode" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AssetAssignment" OWNER TO postgres;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    "checkIn" timestamp(3) without time zone,
    "checkOut" timestamp(3) without time zone,
    "workingDay" numeric(65,30) DEFAULT 0 NOT NULL,
    status public."AttendanceStatus" DEFAULT 'NORMAL'::public."AttendanceStatus" NOT NULL
);


ALTER TABLE public."Attendance" OWNER TO postgres;

--
-- Name: AttendanceAdjustment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AttendanceAdjustment" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    "oldTime" text,
    "newTime" text NOT NULL,
    reason text NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AttendanceAdjustment" OWNER TO postgres;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    action text NOT NULL,
    "tableName" text NOT NULL,
    "recordId" text NOT NULL,
    "accountId" text NOT NULL,
    details text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: Candidate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Candidate" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    "cvUrl" text,
    "jobPostingId" text NOT NULL,
    status public."CandidateStatus" DEFAULT 'SOURCED'::public."CandidateStatus" NOT NULL
);


ALTER TABLE public."Candidate" OWNER TO postgres;

--
-- Name: CandidateFeedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CandidateFeedback" (
    id text NOT NULL,
    "interviewRoundId" text NOT NULL,
    score integer NOT NULL,
    comments text
);


ALTER TABLE public."CandidateFeedback" OWNER TO postgres;

--
-- Name: CandidateUser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CandidateUser" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CandidateUser" OWNER TO postgres;

--
-- Name: Certificate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Certificate" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    name text NOT NULL,
    "issuedBy" text NOT NULL,
    "issueDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone
);


ALTER TABLE public."Certificate" OWNER TO postgres;

--
-- Name: Contract; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contract" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "contractType" public."ContractType" NOT NULL,
    "baseSalary" numeric(65,30) NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    status public."ContractStatus" DEFAULT 'ACTIVE'::public."ContractStatus" NOT NULL
);


ALTER TABLE public."Contract" OWNER TO postgres;

--
-- Name: Decision; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Decision" (
    id text NOT NULL,
    "decisionNumber" text NOT NULL,
    title text NOT NULL,
    type public."DecisionType" NOT NULL,
    "employeeId" text NOT NULL,
    "oldSalary" numeric(65,30),
    "newSalary" numeric(65,30),
    "oldDepartmentId" text,
    "newDepartmentId" text,
    "oldPositionId" text,
    "newPositionId" text,
    reason text,
    "effectiveDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."DecisionStatus" DEFAULT 'PENDING'::public."DecisionStatus" NOT NULL,
    "signBy" text,
    "signDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Decision" OWNER TO postgres;

--
-- Name: Degree; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Degree" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "degreeName" text NOT NULL,
    major text NOT NULL,
    institution text NOT NULL,
    "gradYear" integer
);


ALTER TABLE public."Degree" OWNER TO postgres;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "parentId" text,
    "managerId" text,
    "managerName" text,
    quota integer DEFAULT 15 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


ALTER TABLE public."Department" OWNER TO postgres;

--
-- Name: Employee; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    code text NOT NULL,
    "fullName" text NOT NULL,
    cccd text,
    status public."EmployeeStatus" DEFAULT 'ACTIVE'::public."EmployeeStatus" NOT NULL,
    "joinDate" timestamp(3) without time zone NOT NULL,
    "departmentId" text,
    "positionId" text,
    address text,
    "dateOfBirth" timestamp(3) without time zone,
    email text,
    gender text,
    phone text,
    "bankAccount" text,
    "bankName" text,
    "emergencyContactName" text,
    "emergencyContactPhone" text,
    "emergencyContactRelation" text,
    "healthInsurance" text,
    "maritalStatus" text,
    nationality text,
    "socialInsurance" text,
    "taxCode" text
);


ALTER TABLE public."Employee" OWNER TO postgres;

--
-- Name: EmploymentHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."EmploymentHistory" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "departmentId" text,
    "positionId" text,
    "changeReason" text NOT NULL,
    "effectiveDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    salary numeric(65,30),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."EmploymentHistory" OWNER TO postgres;

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    date date NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO postgres;

--
-- Name: InterviewRound; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InterviewRound" (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "interviewerId" text NOT NULL,
    "roundName" text NOT NULL,
    "scheduledAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING_CONFIRMATION'::text NOT NULL,
    location text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "candidateResponse" text,
    "respondedAt" timestamp(3) without time zone
);


ALTER TABLE public."InterviewRound" OWNER TO postgres;

--
-- Name: JobOffer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JobOffer" (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    "baseSalary" numeric(65,30) NOT NULL,
    "probationRate" integer DEFAULT 85 NOT NULL,
    "startDate" date NOT NULL,
    status public."OfferStatus" DEFAULT 'PENDING'::public."OfferStatus" NOT NULL,
    "contractType" text DEFAULT 'PROBATION'::text,
    "declineReason" text,
    notes text,
    "respondedAt" timestamp(3) without time zone,
    "createdAt" timestamp without time zone DEFAULT now(),
    "expiresAt" timestamp without time zone
);


ALTER TABLE public."JobOffer" OWNER TO postgres;

--
-- Name: JobPosting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."JobPosting" (
    id text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    amount integer DEFAULT 1 NOT NULL,
    deadline timestamp(3) without time zone,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "salaryRange" text,
    "jobType" text DEFAULT 'Full-time'::text NOT NULL,
    level text,
    "departmentId" text,
    "positionId" text,
    "experienceLevel" text DEFAULT 'Không yêu cầu'::text,
    location text DEFAULT 'Hà Nội'::text,
    "recruiterName" text,
    "recruitmentReason" text DEFAULT 'EXPANSION'::text,
    "targetStartDate" timestamp(3) without time zone,
    "workplaceType" text DEFAULT 'On-site'::text
);


ALTER TABLE public."JobPosting" OWNER TO postgres;

--
-- Name: KPI; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."KPI" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    description text NOT NULL,
    target numeric(65,30) NOT NULL,
    achieved numeric(65,30) DEFAULT 0 NOT NULL
);


ALTER TABLE public."KPI" OWNER TO postgres;

--
-- Name: KPITemplate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."KPITemplate" (
    id text NOT NULL,
    name text NOT NULL,
    department text NOT NULL,
    criteria integer NOT NULL,
    weight text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL
);


ALTER TABLE public."KPITemplate" OWNER TO postgres;

--
-- Name: LeaveBalance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeaveBalance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    year integer NOT NULL,
    "totalDays" numeric(65,30) DEFAULT 12 NOT NULL,
    "usedDays" numeric(65,30) DEFAULT 0 NOT NULL
);


ALTER TABLE public."LeaveBalance" OWNER TO postgres;

--
-- Name: LeavePolicy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeavePolicy" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    seniority text NOT NULL,
    "extraDays" text NOT NULL,
    "maxDays" text NOT NULL
);


ALTER TABLE public."LeavePolicy" OWNER TO postgres;

--
-- Name: LeaveRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeaveRequest" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveType" public."LeaveType" NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    reason text,
    "approverId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LeaveRequest" OWNER TO postgres;

--
-- Name: LeaveTypeConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LeaveTypeConfig" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "defaultDays" integer DEFAULT 12 NOT NULL,
    paid boolean DEFAULT true NOT NULL,
    "carryForward" boolean DEFAULT true NOT NULL,
    status text DEFAULT 'Hoạt động'::text NOT NULL
);


ALTER TABLE public."LeaveTypeConfig" OWNER TO postgres;

--
-- Name: OTRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OTRequest" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    "requestHours" numeric(65,30) NOT NULL,
    "actualHours" numeric(65,30) DEFAULT 0 NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    reason text
);


ALTER TABLE public."OTRequest" OWNER TO postgres;

--
-- Name: OnboardingTask; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OnboardingTask" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "taskName" text NOT NULL,
    category text NOT NULL,
    "isCompleted" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."OnboardingTask" OWNER TO postgres;

--
-- Name: PayrollPeriod; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayrollPeriod" (
    id text NOT NULL,
    "monthYear" text NOT NULL,
    "standardWorkingDays" integer NOT NULL,
    status public."PayrollStatus" DEFAULT 'DRAFT'::public."PayrollStatus" NOT NULL
);


ALTER TABLE public."PayrollPeriod" OWNER TO postgres;

--
-- Name: Payslip; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payslip" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "payrollPeriodId" text NOT NULL,
    "actualWorkingDays" numeric(65,30) NOT NULL,
    "baseSalary" numeric(65,30) NOT NULL,
    "grossSalary" numeric(65,30) NOT NULL,
    "insuranceDeduction" numeric(65,30) DEFAULT 0 NOT NULL,
    "taxDeduction" numeric(65,30) DEFAULT 0 NOT NULL,
    "leaveClawback" numeric(65,30) DEFAULT 0 NOT NULL,
    "netSalary" numeric(65,30) NOT NULL
);


ALTER TABLE public."Payslip" OWNER TO postgres;

--
-- Name: PayslipDetail; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PayslipDetail" (
    id text NOT NULL,
    "payslipId" text NOT NULL,
    type text NOT NULL,
    amount numeric(65,30) NOT NULL,
    description text NOT NULL
);


ALTER TABLE public."PayslipDetail" OWNER TO postgres;

--
-- Name: PerformanceReview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PerformanceReview" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "reviewCycleId" text NOT NULL,
    score numeric(65,30) NOT NULL,
    comments text
);


ALTER TABLE public."PerformanceReview" OWNER TO postgres;

--
-- Name: Permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    action text NOT NULL,
    description text
);


ALTER TABLE public."Permission" OWNER TO postgres;

--
-- Name: Position; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Position" (
    id text NOT NULL,
    code text,
    title text NOT NULL,
    description text,
    level text DEFAULT 'Staff'::text NOT NULL,
    "minSalary" integer DEFAULT 0 NOT NULL,
    "maxSalary" integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "departmentId" text
);


ALTER TABLE public."Position" OWNER TO postgres;

--
-- Name: PreOnboardingProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PreOnboardingProfile" (
    id text NOT NULL,
    "candidateId" text NOT NULL,
    cccd text,
    gender text,
    "dateOfBirth" timestamp(3) without time zone,
    address text,
    nationality text DEFAULT 'Việt Nam'::text,
    "maritalStatus" text,
    "taxCode" text,
    "bankName" text,
    "bankAccount" text,
    "socialInsurance" text,
    "healthInsurance" text,
    "emergencyContactName" text,
    "emergencyContactPhone" text,
    "emergencyContactRelation" text,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PreOnboardingProfile" OWNER TO postgres;

--
-- Name: Relative; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Relative" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "fullName" text NOT NULL,
    relation text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    "taxCode" text,
    "isDependent" boolean DEFAULT false NOT NULL
);


ALTER TABLE public."Relative" OWNER TO postgres;

--
-- Name: ReviewCycle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ReviewCycle" (
    id text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ReviewCycle" OWNER TO postgres;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RolePermission" (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO postgres;

--
-- Name: Shift; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Shift" (
    id text NOT NULL,
    name text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "breakTime" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "workHours" numeric(65,30) DEFAULT 8 NOT NULL
);


ALTER TABLE public."Shift" OWNER TO postgres;

--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemSetting" (
    id text NOT NULL,
    category text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    value text NOT NULL,
    "dataType" text DEFAULT 'NUMBER'::text NOT NULL,
    description text,
    unit text,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO postgres;

--
-- Name: TaxBracket; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TaxBracket" (
    id text NOT NULL,
    tier integer NOT NULL,
    "minIncome" numeric(65,30) NOT NULL,
    "maxIncome" numeric(65,30),
    "taxRate" numeric(65,30) NOT NULL
);


ALTER TABLE public."TaxBracket" OWNER TO postgres;

--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, username, password, "employeeId", "roleId", "isActive") FROM stdin;
52a74bbc-0a06-4023-9e84-80ad98f45f81	admin	$2b$10$hI.1yyyDxjnlGA4j9900x.1c4C3bJ1JewOfSQP1JJKTb7EmhqftUK	\N	338201fb-f22d-4b41-a005-2c82ebf0a7a4	t
e07e0b58-0c8f-434c-b258-f4eda9671e10	emp01	$2b$10$hI.1yyyDxjnlGA4j9900x.1c4C3bJ1JewOfSQP1JJKTb7EmhqftUK	5dd59619-3a74-4357-a719-80b8cd6dd323	a9e38fc6-58ef-4d65-8133-6f0b34d26cb7	t
\.


--
-- Data for Name: Allowance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Allowance" (id, name, amount, "isTaxable") FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Asset" (id, code, name, category, "serialNumber", price, "purchaseDate", supplier, status, condition, location, notes, "createdAt", "updatedAt") FROM stdin;
529a2038-07eb-4af4-baa4-d0f32083b1ab	TS-LAP-001	MacBook Pro 14" M3 Pro 18GB/512GB Space Black	LAPTOP	C02G90XXMD6M	49990000.000000000000000000000000000000	2025-11-15 00:00:00	FPT Synnex Distribution	AVAILABLE	Mới 100%, nguyên hộp	Kho CNTT - Tủ A1	Trang bị cho Senior Software Engineer / Tech Lead	2026-10-07 01:48:25.47	2026-10-07 01:48:25.47
3178684d-ec70-4ef1-9fbc-1a1d923e1d78	TS-LAP-002	Dell XPS 15 9530 i7-13700H 32GB RTX 4060	LAPTOP	DL-XPS-883921	42500000.000000000000000000000000000000	2025-10-01 00:00:00	Hapro Distribution	ASSIGNED	Hoạt động tốt 99%, có dán màn hình	Bàn làm việc - Tầng 4	Bàn giao cho Trưởng phòng Kỹ thuật	2026-10-07 01:48:25.476	2026-10-07 01:48:25.476
3076fce3-685d-42be-9dc1-2f7e7e6fd85c	TS-LAP-003	Lenovo ThinkPad T14 Gen 4 Ryzen 7 16GB	LAPTOP	PF-4KN892	26800000.000000000000000000000000000000	2025-12-05 00:00:00	Phong Vũ Computer	AVAILABLE	Mới 100%, kèm sạc 65W Type-C	Kho CNTT - Tủ A2	Dành cho nhân sự Onboarding mới	2026-10-07 01:48:25.485	2026-10-07 01:48:25.485
9f6fbe7b-6812-4529-87e8-60bb8df3ee78	TS-MON-001	Dell UltraSharp 27" U2724D 2K IPS Black 120Hz	MONITOR	CN-0K793H-74443	10490000.000000000000000000000000000000	2025-11-20 00:00:00	Hapro Distribution	ASSIGNED	Hoạt động hoàn hảo, không điểm chết	Bàn làm việc - Tầng 4	Màn hình đồ họa / code	2026-10-07 01:48:25.487	2026-10-07 01:48:25.487
3d813c59-8f45-485c-8f50-6aa4978cd0f2	TS-MON-002	LG 27UP850N-W 27" 4K UHD Type-C 90W HDR400	MONITOR	309NTAK7Y211	8900000.000000000000000000000000000000	2025-12-10 00:00:00	Phúc Anh Smart World	AVAILABLE	Mới 100%	Kho CNTT - Kệ Màn Hình	Cấp phát cho Developer	2026-10-07 01:48:25.491	2026-10-07 01:48:25.491
cafe1a8b-ab07-4538-9cb3-f8c4e8c3854b	TS-CRD-001	Thẻ từ thang máy & Ra vào văn phòng tòa nhà P.402	ACCESS_CARD	RFID-HEX-99812	150000.000000000000000000000000000000	2026-01-05 00:00:00	Ban Quản Lý Tòa Nhà	ASSIGNED	Nguyên vẹn kèm dây đeo nhận diện	Văn phòng chính	Thẻ gửi xe + vào cửa tầng 4	2026-10-07 01:48:25.493	2026-10-07 01:48:25.493
7fdd0f98-26db-4b47-8012-513c129bd3b7	TS-PHN-001	Apple iPhone 15 128GB Black (Test Device)	PHONE	FK2910MQL2	19500000.000000000000000000000000000000	2025-09-12 00:00:00	Viettel Store	MAINTENANCE	Đang bảo hành pin tại Apple Care+	Phòng Lab QA/QC	Thiết bị test kiểm thử ứng dụng di động	2026-10-07 01:48:25.497	2026-10-07 01:48:25.497
\.


--
-- Data for Name: AssetAssignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AssetAssignment" (id, "assetId", "employeeId", "assignedDate", "returnedDate", status, "conditionOnAssign", "conditionOnReturn", "handoverDocCode", notes, "createdAt", "updatedAt") FROM stdin;
efc05c58-f398-4d1e-a7e7-6bfaa7ff092a	3178684d-ec70-4ef1-9fbc-1a1d923e1d78	05a011df-a0e0-4714-9868-9f18ae82b2e4	2026-01-15 00:00:00	\N	ACTIVE	Máy nguyên tem, bàn phím gõ tốt, sạc cáp đầy đủ	\N	BB-BG-2026-346	Biên bản bàn giao thiết bị làm việc chính thức theo biểu mẫu BM-01	2026-10-07 01:48:25.48	2026-10-07 01:48:25.48
cc29b381-64ba-429f-8073-2a2f634457ae	9f6fbe7b-6812-4529-87e8-60bb8df3ee78	079d9ff1-f4a4-4377-b474-b675bdbed58c	2026-01-15 00:00:00	\N	ACTIVE	Máy nguyên tem, bàn phím gõ tốt, sạc cáp đầy đủ	\N	BB-BG-2026-131	Biên bản bàn giao thiết bị làm việc chính thức theo biểu mẫu BM-01	2026-10-07 01:48:25.489	2026-10-07 01:48:25.489
330cddbb-4e22-4ddf-a7bb-2cfb3e089b60	cafe1a8b-ab07-4538-9cb3-f8c4e8c3854b	079d9ff1-f4a4-4377-b474-b675bdbed58c	2026-01-15 00:00:00	\N	ACTIVE	Máy nguyên tem, bàn phím gõ tốt, sạc cáp đầy đủ	\N	BB-BG-2026-419	Biên bản bàn giao thiết bị làm việc chính thức theo biểu mẫu BM-01	2026-10-07 01:48:25.494	2026-10-07 01:48:25.494
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendance" (id, "employeeId", date, "checkIn", "checkOut", "workingDay", status) FROM stdin;
f188533e-4423-4fca-8fc8-160eb1dc3b9e	5dd59619-3a74-4357-a719-80b8cd6dd323	2026-09-30	\N	\N	1.000000000000000000000000000000	ABSENT
29386a50-5e57-4011-912c-e30fedb988af	5dd59619-3a74-4357-a719-80b8cd6dd323	2026-09-30	\N	\N	1.000000000000000000000000000000	ABSENT
565c6e2a-cfdf-4636-948c-2ad8e21b1db6	5dd59619-3a74-4357-a719-80b8cd6dd323	2026-09-30	\N	\N	1.000000000000000000000000000000	ABSENT
\.


--
-- Data for Name: AttendanceAdjustment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AttendanceAdjustment" (id, "employeeId", date, type, "oldTime", "newTime", reason, status, "createdAt") FROM stdin;
64a339ca-e9fb-408c-85ae-b369c904992b	5dd59619-3a74-4357-a719-80b8cd6dd323	2026-08-19	Sai giờ làm	14:00	17:30	Đi gặp khách hàng nên không check-out tại công ty	APPROVED	2026-10-02 06:53:47.149
fd06f008-a1cd-4808-9331-8baf370e4f20	5dd59619-3a74-4357-a719-80b8cd6dd323	2026-08-15	Thiếu Check-out	\N	18:00	Hệ thống lỗi không nhận diện khuôn mặt	REJECTED	2026-10-02 06:53:47.149
6c7958af-acd1-497d-811a-04f1516f4846	5dd59619-3a74-4357-a719-80b8cd6dd323	2026-08-20	Thiếu Check-in	\N	08:00	Quên chấm công đầu giờ	REJECTED	2026-10-02 06:53:47.149
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, action, "tableName", "recordId", "accountId", details, "createdAt") FROM stdin;
\.


--
-- Data for Name: Candidate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Candidate" (id, name, email, phone, "cvUrl", "jobPostingId", status) FROM stdin;
55c4f7e5-792a-4b28-8a6e-166d699f45e6	Phan Văn Cường	cường.phan833@gmail.com	0929515288	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	849c60ff-7842-43e9-8fb2-51173c72e319	SOURCED
8fb64c71-5b4f-4fe5-a94f-e626b0aecc52	Võ Hải Nam	nam.võ713@gmail.com	0941806694	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	849c60ff-7842-43e9-8fb2-51173c72e319	SOURCED
8c3efe20-ce21-45a3-b93f-51d101011877	Huỳnh Văn Dũng	dũng.huỳnh195@gmail.com	0986050222	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	849c60ff-7842-43e9-8fb2-51173c72e319	SOURCED
13e1e104-cdbf-4dd9-ac35-6bb812556b5f	Vũ Minh Linh	linh.vũ76@gmail.com	0923805984	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	849c60ff-7842-43e9-8fb2-51173c72e319	SOURCED
78302489-6bef-4bf6-98e9-1fbc52093281	Phan Tuấn Phúc	phúc.phan455@gmail.com	0951660955	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	849c60ff-7842-43e9-8fb2-51173c72e319	SOURCED
a7ccfc3f-9dc7-426a-9d37-8b3817cd9ce2	Trần Thị An	an.trần656@gmail.com	0914905220	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	849c60ff-7842-43e9-8fb2-51173c72e319	SOURCED
fde9ec73-b2f1-4175-a8e2-71289f55c9ba	Võ Minh Phúc	phúc.võ365@gmail.com	0948096334	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	24a36872-8805-40bf-9e13-0adebef3f833	SOURCED
43a65c60-d915-4735-aa63-a86a170fd4a6	Võ Hải Bình	bình.võ686@gmail.com	0927787138	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	24a36872-8805-40bf-9e13-0adebef3f833	SOURCED
352a4401-9e44-4109-83aa-02a4a4967cd1	Nguyễn Đức Trang	trang.nguyễn492@gmail.com	0968876542	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	24a36872-8805-40bf-9e13-0adebef3f833	SOURCED
a5a8e0ce-227b-44cf-b09c-f135383e2f64	Trần Thanh Hương	hương.trần624@gmail.com	0978998504	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	24a36872-8805-40bf-9e13-0adebef3f833	SOURCED
e888af93-3196-4a8f-b1db-13fe5bfe0107	Võ Hải Cường	cường.võ276@gmail.com	0981913293	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	24a36872-8805-40bf-9e13-0adebef3f833	SOURCED
2c6a436e-d9ef-4b3b-8847-584b8ebe83c6	Hoàng Hữu Tú	tú.hoàng629@gmail.com	0986694234	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	24a36872-8805-40bf-9e13-0adebef3f833	SOURCED
63faad03-ebf6-4348-af82-c49cc95db53b	Võ Văn Anh	anh.võ209@gmail.com	0983976705	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	acd593b0-8d1e-44eb-8ec8-df4ca94985d5	SOURCED
9a2da771-4c12-47aa-b547-8fad672ee08a	Phan Tuấn Sơn	sơn.phan813@gmail.com	0963135048	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	acd593b0-8d1e-44eb-8ec8-df4ca94985d5	SOURCED
005d8f83-6b0d-45d1-bf3a-c5d1e931a78a	Võ Hữu Nam	nam.võ434@gmail.com	0956280053	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	acd593b0-8d1e-44eb-8ec8-df4ca94985d5	SOURCED
f9b773dd-f864-4757-a7f8-2ff58c21078b	Phạm Thanh Hương	hương.phạm239@gmail.com	0968458576	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	acd593b0-8d1e-44eb-8ec8-df4ca94985d5	SOURCED
5c98f0b8-64f2-48f4-8020-c58b0cec2776	Hoàng Tuấn Trang	trang.hoàng759@gmail.com	0979076347	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	8485cdcf-56ad-4749-9f03-4b5bc258f1b7	SOURCED
ff2da82c-0d89-40b5-b2fc-b758604613a4	Nguyễn Hoàng Anh	anh.nguyễn756@gmail.com	0953335372	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	8485cdcf-56ad-4749-9f03-4b5bc258f1b7	SOURCED
c8e07b6e-340d-4930-a37f-96f512fe1312	Phạm Hải Linh	linh.phạm104@gmail.com	0933622242	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	8485cdcf-56ad-4749-9f03-4b5bc258f1b7	SOURCED
91c98d39-6795-4821-9095-01b960160d5a	Hoàng Tuấn Sơn	sơn.hoàng883@gmail.com	0966533981	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	8485cdcf-56ad-4749-9f03-4b5bc258f1b7	SOURCED
7112eb6d-4069-457c-adf6-55351ed5477e	Hoàng Tuấn Phúc	phúc.hoàng949@gmail.com	0931317319	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	SOURCED
01be5c74-199d-4731-ab28-d77090de8775	Trần Hữu Nam	nam.trần176@gmail.com	0958727021	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	SOURCED
8b059ab0-d386-45a1-bad4-655b928ccbf5	Nguyễn Văn Cường	cường.nguyễn962@gmail.com	0975387650	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	SOURCED
9dd25875-99b9-461a-af61-82aa23aba6c0	Vũ Đức Tú	tú.vũ207@gmail.com	0968269287	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	SOURCED
e763860e-d6e3-4427-8862-516bd2cc96ff	Đặng Hữu Cường	cường.đặng839@gmail.com	0961801138	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	INTERVIEWING
488897cb-d431-4531-bf06-93ecf4c23b07	Nguyễn Văn Ứng Viên	ungvien@gmail.com	0901234567	https://drive.google.com/demo-cv	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	SOURCED
4277e2ad-21b2-4e56-99c5-bb8b9ba135b5	Nguyễn Văn Test	candidate.test@lla.vn	0987654321	https://drive.google.com/test-cv	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	HIRED
cb16ad07-26b7-4eb3-b99e-3b48d651dbbd	Phạm Văn Yến	yến.phạm614@gmail.com	0964930658	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	24a36872-8805-40bf-9e13-0adebef3f833	REJECTED
b6d0e3d7-558e-431e-875c-3faaa35cbc85	Đặng Đức Phúc	phúc.đặng975@gmail.com	0964500586	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	acd593b0-8d1e-44eb-8ec8-df4ca94985d5	HIRED
0e38cd3b-acfc-4f81-9816-4bf69f597477	Phan Ngọc Nam	nam.phan51@gmail.com	0987468084	https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	OFFERING
49d93e09-d807-4f2e-891a-592c3dc57b17	Nguyễn Văn Ứng Viên (Demo)	candidate@example.com	0987654321	https://example.com/cv.pdf	849c60ff-7842-43e9-8fb2-51173c72e319	OFFERING
7023b75b-1e8b-4459-a684-5beee979f8b7	Nguyễn Văn Ứng Viên	ungvien@gmail.com	0901234567	http://localhost:5173/candidate	96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	OFFERING
\.


--
-- Data for Name: CandidateFeedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CandidateFeedback" (id, "interviewRoundId", score, comments) FROM stdin;
03f242e4-cf46-49e7-92d7-0b65666f66ee	0df3e7bf-2cf5-460e-ac4c-42e7d0a38d82	10	âs
33d7efe6-b91a-4a73-8af1-d9789845fcca	d065ed35-238c-4b77-a9f2-955fcd88c3b9	7	kjfg
\.


--
-- Data for Name: CandidateUser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CandidateUser" (id, email, password, name, phone, "createdAt", "updatedAt") FROM stdin;
46e30ff3-e8eb-4f5e-939b-be2f557eed8a	candidate.test@lla.vn	$2b$10$UOISM.3nDAVsi1J0/Vm/1el6RCRGQV/0QdTWbySzZCKZj1Y7fD8p6	Nguyễn Văn Test	0987654321	2026-10-08 04:15:51.418	2026-10-08 04:15:51.418
c1c7844f-860a-4cf3-a8b6-c65751c694d3	admin@gmail.com	$2b$10$KJ29RjNs1s6gpkjnQWUirO7GRRjisflKDBjAHov10PuFWlsfMalfa	admin123	0111111111	2026-10-08 09:10:53.781	2026-10-08 09:10:53.781
0ca44276-d362-4176-82c9-e4faaab69a82	candidate@example.com	$2b$10$VnOAUDTck72BJPwEAPEAxeuk0xwuDUhWXtGecNaIj9eEghJ9yDEPS	Nguyễn Văn Ứng Viên (Demo)	0987654321	2026-10-09 09:40:53.676	2026-10-09 09:40:53.676
bcfc7534-7cae-4dbd-837d-ec1303a98219	ungvien@gmail.com	$2b$10$VnOAUDTck72BJPwEAPEAxeuk0xwuDUhWXtGecNaIj9eEghJ9yDEPS	Nguyễn Văn Ứng Viên	0901234567	2026-10-08 04:33:14.017	2026-10-08 04:33:14.017
\.


--
-- Data for Name: Certificate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Certificate" (id, "employeeId", name, "issuedBy", "issueDate", "expiryDate") FROM stdin;
\.


--
-- Data for Name: Contract; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Contract" (id, "employeeId", "contractType", "baseSalary", "startDate", "endDate", status) FROM stdin;
34d8fc75-88b3-4add-8507-1aa4ff970984	6e7679f1-6486-41d9-990f-f40f94b5b881	PROBATION	15000000.000000000000000000000000000000	2026-10-01 00:00:00	\N	ACTIVE
734ff7b0-9862-4ea4-a1f7-8fa23961e23a	075505bf-61f1-435f-8d29-a68c4c32eee3	PROBATION	18000000.000000000000000000000000000000	2026-10-15 00:00:00	\N	ACTIVE
\.


--
-- Data for Name: Decision; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Decision" (id, "decisionNumber", title, type, "employeeId", "oldSalary", "newSalary", "oldDepartmentId", "newDepartmentId", "oldPositionId", "newPositionId", reason, "effectiveDate", status, "signBy", "signDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Degree; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Degree" (id, "employeeId", "degreeName", major, institution, "gradYear") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Department" (id, code, name, "parentId", "managerId", "managerName", quota, status) FROM stdin;
5aa9188c-2788-495f-9ee7-65402db0856a	BA	Tổ Phân tích	d9931a3b-7089-4fd8-a852-27bc37e3ee61	\N	Trần Việt Anh	5	ACTIVE
6f7fa8e2-e829-4544-a063-48ce099d7af1	BGD	Ban Giám đốc	cce04a9a-f192-4926-8b0f-28cdef9b067a	\N	Phạm Hoàng Long	5	ACTIVE
3b6e8018-8b99-4837-9f2a-63bed98e75f2	DEV	Tổ Phát triển	d9931a3b-7089-4fd8-a852-27bc37e3ee61	\N	Nguyễn Huy Hoàng	15	ACTIVE
de156231-1c54-4603-889c-51a0bd186848	KT	Phòng Kế toán	cce04a9a-f192-4926-8b0f-28cdef9b067a	\N	Nguyễn Thị Nhàn	5	ACTIVE
cce04a9a-f192-4926-8b0f-28cdef9b067a	LLA	Công ty TNHH Thương mại và Dịch vụ LLA	\N	\N	Phạm Hoàng Long	50	ACTIVE
eb51497c-6ddd-454b-b56f-b5ebd54a3b0e	TEST	Tổ Kiểm thử	d9931a3b-7089-4fd8-a852-27bc37e3ee61	\N	Lê Thị Thúy	10	ACTIVE
d9931a3b-7089-4fd8-a852-27bc37e3ee61	SX	Khối Sản xuất	cce04a9a-f192-4926-8b0f-28cdef9b067a	\N	Ngô Xuân Cương	30	ACTIVE
2272c377-9ea5-48b0-b1d5-6a6c87c02a4f	MKT	Phòng Marketing	cce04a9a-f192-4926-8b0f-28cdef9b067a	\N	Nguyễn Thị Kim Ngân	10	ACTIVE
beff8ce4-22e9-4573-8e10-d9aa339513fe	HT	Khối Hạ tầng	cce04a9a-f192-4926-8b0f-28cdef9b067a	\N	Bùi Doãn Tuấn Anh	20	ACTIVE
38a67124-ab63-41b5-9c38-0352b2df8017	HR	Phòng Nhân sự	cce04a9a-f192-4926-8b0f-28cdef9b067a	\N	Phạm Thị Dung	15	ACTIVE
85df4952-a83f-4e53-be36-cce9bf171acf	IT	Phòng Công nghệ	cce04a9a-f192-4926-8b0f-28cdef9b067a	\N	Lê Hữu Trúc	15	ACTIVE
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Employee" (id, code, "fullName", cccd, status, "joinDate", "departmentId", "positionId", address, "dateOfBirth", email, gender, phone, "bankAccount", "bankName", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation", "healthInsurance", "maritalStatus", nationality, "socialInsurance", "taxCode") FROM stdin;
5dd59619-3a74-4357-a719-80b8cd6dd323	NV001	Phạm Hoàng Long	001099000001	ACTIVE	2026-09-03 03:40:47.458	6f7fa8e2-e829-4544-a063-48ce099d7af1	a253a8d3-0554-4634-830c-2ec1199a15ba	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b2d0a71a-29c3-4e57-b029-71cad44ef8a0	NV002	Trần Quốc Dũng	001099000002	ACTIVE	2026-09-03 03:40:47.465	6f7fa8e2-e829-4544-a063-48ce099d7af1	0a399222-bf64-4bd3-96bf-6157be73e3e4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c18ed12e-e6af-4e09-9e84-30dc7d7dc947	NV003	Ngô Xuân Cương	001099000003	ACTIVE	2026-09-03 03:40:47.468	d9931a3b-7089-4fd8-a852-27bc37e3ee61	31de6775-688d-4ab1-a9e1-433811c976a3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3b0ff7d4-3394-49ce-b7c8-3edf7c8e1147	NV004	Nguyễn Thị Nhàn	001099000004	ACTIVE	2026-09-03 03:40:47.47	de156231-1c54-4603-889c-51a0bd186848	4b3186e9-a99b-4fee-8c63-6f8ce9dc0c8a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c81f9cbc-4195-43a2-9cd9-7147fa8b7c63	NV005	Nguyễn Huy Hoàng	001099000005	ACTIVE	2026-09-03 03:40:47.473	3b6e8018-8b99-4837-9f2a-63bed98e75f2	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fd1042e1-013f-4e49-90d5-b3c6fc384401	NV006	Lê Thị Thúy	001099000006	ACTIVE	2026-09-03 03:40:47.475	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dc7cbe23-c0da-4959-94aa-6ce601dfac4a	NV007	Trần Việt Anh	001099000007	ACTIVE	2026-09-03 03:40:47.478	5aa9188c-2788-495f-9ee7-65402db0856a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
72a1ca62-1d35-4e51-9913-0903c8b3c782	EMP-001	Nhân viên 1	079099000001	ACTIVE	2026-09-30 03:57:52.911	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
10c15b9e-3667-4435-ad56-d35266b6e9c6	EMP-002	Nhân viên 2	079099000002	ACTIVE	2026-09-30 03:57:52.925	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
18548c24-00d5-4581-8f68-6481a1d61889	EMP-003	Nhân viên 3	079099000003	ACTIVE	2026-09-30 03:57:52.927	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
377b9a0a-cdfe-48b5-8178-65fa7b814061	EMP-004	Nhân viên 4	079099000004	ACTIVE	2026-09-30 03:57:52.928	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
572fffb4-00fd-4cc0-b6a3-444604e0fb59	EMP-005	Nhân viên 5	079099000005	ACTIVE	2026-09-30 03:57:52.93	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b4e94d0d-5bc6-403d-9e8d-1a63c57cb0ff	EMP-006	Nhân viên 6	079099000006	ACTIVE	2026-09-30 03:57:52.931	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
44d44e1d-fa84-45b0-a3f8-20f1af77df63	EMP-007	Nhân viên 7	079099000007	ACTIVE	2026-09-30 03:57:52.933	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
59fe22a6-ba13-4a98-bcd1-0954a0c6a2fc	EMP-008	Nhân viên 8	079099000008	ACTIVE	2026-09-30 03:57:52.934	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d55606f9-f019-4798-917c-4af47388052f	EMP-009	Nhân viên 9	079099000009	ACTIVE	2026-09-30 03:57:52.936	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
59187b3f-bf20-48ff-8248-5c0f92ac33be	EMP-010	Nhân viên 10	079099000010	ACTIVE	2026-09-30 03:57:52.937	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8118f569-4ffe-4e39-92be-5490bd788a15	EMP-011	Nhân viên 11	079099000011	ACTIVE	2026-09-30 03:57:52.938	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4206917a-a4a6-4d34-a0cf-3ad432949725	EMP-012	Nhân viên 12	079099000012	ACTIVE	2026-09-30 03:57:52.939	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e1a4f151-128e-4ff3-a85e-0b8368996c4c	EMP-013	Nhân viên 13	079099000013	ACTIVE	2026-09-30 03:57:52.941	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f6016da2-3aba-4c4b-acc8-89aa57abbf55	EMP-014	Nhân viên 14	079099000014	ACTIVE	2026-09-30 03:57:52.942	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e65914d9-39d0-42bc-913f-51d07ded2f69	EMP-015	Nhân viên 15	079099000015	ACTIVE	2026-09-30 03:57:52.943	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
72eb8568-4e78-4ff0-af89-cc883d6fa837	EMP-016	Nhân viên 16	079099000016	ACTIVE	2026-09-30 03:57:52.944	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bcc5e46c-127e-4071-a212-cc5e9cf7483c	EMP-017	Nhân viên 17	079099000017	ACTIVE	2026-09-30 03:57:52.945	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
737f5a85-e8fa-45fb-b774-b69b8e25d8f1	EMP-018	Nhân viên 18	079099000018	ACTIVE	2026-09-30 03:57:52.947	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ead53793-ad1a-4634-9f96-ec8c3563392f	EMP-019	Nhân viên 19	079099000019	ACTIVE	2026-09-30 03:57:52.948	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
aedaeb9e-f4ee-4786-85e1-982a39bc7e84	EMP-020	Nhân viên 20	079099000020	ACTIVE	2026-09-30 03:57:52.949	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e23db433-a9d1-4ad4-b8a9-df96dfb129aa	EMP-021	Nhân viên 21	079099000021	ACTIVE	2026-09-30 03:57:52.95	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9d48b8f1-1c11-49aa-9a90-4ee95c6224e6	EMP-022	Nhân viên 22	079099000022	ACTIVE	2026-09-30 03:57:52.951	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a8a768c3-ebb1-493d-a79c-56282af47331	EMP-023	Nhân viên 23	079099000023	ACTIVE	2026-09-30 03:57:52.952	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ddfbf883-9a7e-4b53-9ec9-8abb0781a4ba	EMP-024	Nhân viên 24	079099000024	ACTIVE	2026-09-30 03:57:52.954	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
61189529-8f8f-4274-9b22-1c47649d43a2	EMP-025	Nhân viên 25	079099000025	ACTIVE	2026-09-30 03:57:52.955	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
1e010b71-1464-44d2-a3d6-caab34d1f9cf	EMP-026	Nhân viên 26	079099000026	ACTIVE	2026-09-30 03:57:52.956	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8550586b-17af-469c-8da5-ff884a17decd	EMP-027	Nhân viên 27	079099000027	ACTIVE	2026-09-30 03:57:52.957	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
14ea2d87-958f-4453-8737-b35a24033a4a	EMP-028	Nhân viên 28	079099000028	ACTIVE	2026-09-30 03:57:52.958	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a9ecadd0-44fb-4702-800f-43fc93c1459c	EMP-029	Nhân viên 29	079099000029	ACTIVE	2026-09-30 03:57:52.96	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
05a011df-a0e0-4714-9868-9f18ae82b2e4	EMP-030	Nhân viên 30	079099000030	ACTIVE	2026-09-30 03:57:52.961	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
dae88fab-f330-4854-b3b8-2c26d0376468	EMP-031	Nhân viên 31	079099000031	ACTIVE	2026-09-30 03:57:52.962	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
955e828e-566d-453e-8fab-4984bcbbe45c	EMP-032	Nhân viên 32	079099000032	ACTIVE	2026-09-30 03:57:52.964	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7e865b71-f818-4e55-a415-32a3cbdd774e	EMP-033	Nhân viên 33	079099000033	ACTIVE	2026-09-30 03:57:52.965	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
22d63a44-cbfd-42fe-963f-6986c8b88bbc	EMP-034	Nhân viên 34	079099000034	ACTIVE	2026-09-30 03:57:52.967	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7f418709-06af-4361-a87e-964a7420d69c	EMP-035	Nhân viên 35	079099000035	ACTIVE	2026-09-30 03:57:52.968	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
62616f09-defa-47eb-87da-2c1965c86160	EMP-036	Nhân viên 36	079099000036	ACTIVE	2026-09-30 03:57:52.969	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c7acd194-5177-43e9-a8ec-6c43c5e1a69c	EMP-037	Nhân viên 37	079099000037	ACTIVE	2026-09-30 03:57:52.97	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0ee42e61-c631-46cd-8fa9-4ce3a9818b36	EMP-038	Nhân viên 38	079099000038	ACTIVE	2026-09-30 03:57:52.971	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ff2117b9-00db-42ad-87e1-dc6acda64060	EMP-039	Nhân viên 39	079099000039	ACTIVE	2026-09-30 03:57:52.972	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f67f64cb-715d-4837-a428-a69b84a88d4e	EMP-040	Nhân viên 40	079099000040	ACTIVE	2026-09-30 03:57:52.973	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c06aa40f-1d63-41bb-90b8-6c5dffeb7287	EMP-041	Nhân viên 41	079099000041	ACTIVE	2026-09-30 03:57:52.974	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
37cf4b46-0bdc-4e1e-b66f-884802d56207	EMP-042	Nhân viên 42	079099000042	ACTIVE	2026-09-30 03:57:52.975	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bc3df4a3-ab97-4539-927a-05051871442b	EMP-043	Nhân viên 43	079099000043	ACTIVE	2026-09-30 03:57:52.977	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
25af354d-3939-4404-91a8-36611bf9805c	EMP-044	Nhân viên 44	079099000044	ACTIVE	2026-09-30 03:57:52.978	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e3e766ea-75d1-4add-acef-d78c9d4d3f7c	EMP-045	Nhân viên 45	079099000045	ACTIVE	2026-09-30 03:57:52.979	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
50924ed3-094a-4a1d-a0b2-b0b9f692541b	EMP-046	Nhân viên 46	079099000046	ACTIVE	2026-09-30 03:57:52.98	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c2516302-4fa5-47b9-906b-e37d33ae6f78	EMP-047	Nhân viên 47	079099000047	ACTIVE	2026-09-30 03:57:52.981	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5e76cac1-a8e3-4269-bacb-619946ae4fac	EMP-048	Nhân viên 48	079099000048	ACTIVE	2026-09-30 03:57:52.982	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
90937de5-cae5-466b-8971-7f73f83127f2	EMP-049	Nhân viên 49	079099000049	ACTIVE	2026-09-30 03:57:52.983	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
97f3a150-2585-48d4-b6bd-47d776fd2ba3	EMP-050	Nhân viên 50	079099000050	ACTIVE	2026-09-30 03:57:52.984	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5b0c7eb3-ba71-43b1-93fa-83d549c045e4	EMP-051	Nhân viên 51	079099000051	ACTIVE	2026-09-30 03:57:52.986	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
eedb262b-0276-40b9-87ff-78dc7098f546	EMP-052	Nhân viên 52	079099000052	ACTIVE	2026-09-30 03:57:52.987	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6df15582-0803-447c-9f62-c1a64611e94c	EMP-053	Nhân viên 53	079099000053	ACTIVE	2026-09-30 03:57:52.988	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
64d3bb0f-a260-4635-b11a-04a9227f7fd2	EMP-054	Nhân viên 54	079099000054	ACTIVE	2026-09-30 03:57:52.989	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
77915b24-285e-4f57-ba85-2e48f71cd591	EMP-055	Nhân viên 55	079099000055	ACTIVE	2026-09-30 03:57:52.991	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a02afc84-bd96-45cc-9e4a-9457b86e3f86	EMP-056	Nhân viên 56	079099000056	ACTIVE	2026-09-30 03:57:52.992	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e69543f1-dabe-4e4a-9a40-a6b918482a94	EMP-057	Nhân viên 57	079099000057	ACTIVE	2026-09-30 03:57:52.993	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
44a8b24f-0a95-4e0e-948d-0feadfa145d3	EMP-058	Nhân viên 58	079099000058	ACTIVE	2026-09-30 03:57:52.994	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
89596b00-b2cb-4af7-b311-b3ff8deb9db8	EMP-059	Nhân viên 59	079099000059	ACTIVE	2026-09-30 03:57:52.995	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ecc768b5-d013-489b-8d7e-d112bbc3893a	EMP-060	Nhân viên 60	079099000060	ACTIVE	2026-09-30 03:57:52.996	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c04740d7-ed77-4caf-92f2-ab68be7d0e29	EMP-061	Nhân viên 61	079099000061	ACTIVE	2026-09-30 03:57:52.998	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9571a05f-f6b8-4aaf-8773-f9a3db9c15d1	EMP-062	Nhân viên 62	079099000062	ACTIVE	2026-09-30 03:57:52.999	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b0dc0937-eab0-42f9-b304-dc77bbc1665b	EMP-063	Nhân viên 63	079099000063	ACTIVE	2026-09-30 03:57:53	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a53e5904-26f6-4d1a-b0d3-95ad84a84373	EMP-064	Nhân viên 64	079099000064	ACTIVE	2026-09-30 03:57:53.002	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4d567526-e1d3-4627-8ea1-ac05525314ee	EMP-065	Nhân viên 65	079099000065	ACTIVE	2026-09-30 03:57:53.003	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fc9d75b1-fbf2-4540-a9f8-79ccdda9f674	EMP-066	Nhân viên 66	079099000066	ACTIVE	2026-09-30 03:57:53.005	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
70730c83-f821-45ea-ac64-7fa9f38cbe5d	EMP-067	Nhân viên 67	079099000067	ACTIVE	2026-09-30 03:57:53.006	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
74a9e029-8f4f-404d-93f2-666b1cae55f9	EMP-068	Nhân viên 68	079099000068	ACTIVE	2026-09-30 03:57:53.008	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d08bc8b0-bfac-420f-a0d0-93081726b51f	EMP-069	Nhân viên 69	079099000069	ACTIVE	2026-09-30 03:57:53.009	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
62e8bce4-d380-4011-9cd0-1f8ad41ca6a4	EMP-070	Nhân viên 70	079099000070	ACTIVE	2026-09-30 03:57:53.01	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4a8bfa2a-ebe0-4dd8-bedf-4f20bd9e3c05	EMP-071	Nhân viên 71	079099000071	ACTIVE	2026-09-30 03:57:53.011	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
18f6599c-2d2f-495a-9112-5e62615348eb	EMP-072	Nhân viên 72	079099000072	ACTIVE	2026-09-30 03:57:53.013	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
079d9ff1-f4a4-4377-b474-b675bdbed58c	EMP-073	Nhân viên 73	079099000073	ACTIVE	2026-09-30 03:57:53.014	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fc09b3b8-fa7d-47ce-8334-251329fcf010	EMP-074	Nhân viên 74	079099000074	ACTIVE	2026-09-30 03:57:53.015	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8dfdd822-3b46-4078-98b6-ab890781381e	EMP-075	Nhân viên 75	079099000075	ACTIVE	2026-09-30 03:57:53.016	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0da21e65-7c52-4dc4-beb5-110d6c9cbe9b	EMP-076	Nhân viên 76	079099000076	ACTIVE	2026-09-30 03:57:53.017	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ee9b66cf-3dc7-46b5-9e7c-a33f0499bb58	EMP-077	Nhân viên 77	079099000077	ACTIVE	2026-09-30 03:57:53.019	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
876f082d-2917-4d15-92da-835933cec5cc	EMP-078	Nhân viên 78	079099000078	ACTIVE	2026-09-30 03:57:53.021	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
be02b874-bc97-4b94-bca5-75bf75a4633d	EMP-079	Nhân viên 79	079099000079	ACTIVE	2026-09-30 03:57:53.022	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
32f7c531-0438-472e-8573-94e6ea505a04	EMP-080	Nhân viên 80	079099000080	ACTIVE	2026-09-30 03:57:53.023	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3b35c736-0a1d-40e8-a5d3-8ea3f6661d69	EMP-081	Nhân viên 81	079099000081	ACTIVE	2026-09-30 03:57:53.024	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b2dcf89e-2e7c-402f-8403-1c8c8915f019	EMP-082	Nhân viên 82	079099000082	ACTIVE	2026-09-30 03:57:53.025	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a2c74307-5afc-484a-9184-ec9d36c07f05	EMP-083	Nhân viên 83	079099000083	ACTIVE	2026-09-30 03:57:53.026	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
864afd8e-ddbd-4f36-9893-2521e8007547	EMP-084	Nhân viên 84	079099000084	ACTIVE	2026-09-30 03:57:53.027	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f279ec9f-06a5-46b2-9253-a1edf7ffa43b	EMP-085	Nhân viên 85	079099000085	ACTIVE	2026-09-30 03:57:53.028	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
abf944d6-1050-4f08-9731-007492acdb45	EMP-086	Nhân viên 86	079099000086	ACTIVE	2026-09-30 03:57:53.029	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
2d5a98c0-e8bd-4cf8-ae69-44100786baf3	EMP-087	Nhân viên 87	079099000087	ACTIVE	2026-09-30 03:57:53.03	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
5f307547-a5e7-42f1-a2d1-926ed0523bcf	EMP-088	Nhân viên 88	079099000088	ACTIVE	2026-09-30 03:57:53.032	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
68d45f9d-6834-453d-9f58-af798e43e5ba	EMP-089	Nhân viên 89	079099000089	ACTIVE	2026-09-30 03:57:53.033	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
10c3a112-0761-4065-b370-b16901f58620	EMP-090	Nhân viên 90	079099000090	ACTIVE	2026-09-30 03:57:53.034	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
142e9d34-2acd-48a3-ab0f-e785dd2d4e05	EMP-091	Nhân viên 91	079099000091	ACTIVE	2026-09-30 03:57:53.035	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
beeeba07-b2ad-4f32-a5b7-c3feef4e3210	EMP-092	Nhân viên 92	079099000092	ACTIVE	2026-09-30 03:57:53.036	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fc5360b6-5ca9-4bbb-a0eb-f5ff4a11fb16	EMP-093	Nhân viên 93	079099000093	ACTIVE	2026-09-30 03:57:53.037	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fb8714ec-e7fd-43f2-9ac9-d8130d882422	EMP-094	Nhân viên 94	079099000094	ACTIVE	2026-09-30 03:57:53.038	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e9bdd481-4c28-4399-ab4d-ea9aa0fab281	EMP-095	Nhân viên 95	079099000095	ACTIVE	2026-09-30 03:57:53.039	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
7b617691-648c-45bc-a761-1172aff3821a	EMP-096	Nhân viên 96	079099000096	ACTIVE	2026-09-30 03:57:53.04	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a87278c6-ec55-40fd-b135-d106441c5a6c	EMP-097	Nhân viên 97	079099000097	ACTIVE	2026-09-30 03:57:53.041	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
4565888c-315d-4aaf-8b6d-7eb94360e8fb	EMP-098	Nhân viên 98	079099000098	ACTIVE	2026-09-30 03:57:53.042	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ca93849b-12bb-4795-bf12-d592a59631f7	EMP-099	Nhân viên 99	079099000099	ACTIVE	2026-09-30 03:57:53.043	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
78b2e885-7052-48ec-b0f0-c63bf9f3bb22	EMP-100	Nhân viên 100	079099000100	ACTIVE	2026-09-30 03:57:53.044	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b194f8f5-5517-4e82-b309-e3d6d527f9e5	EMP-101	Nhân viên 101	079099000101	ACTIVE	2026-09-30 03:57:53.045	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
689306c8-fa09-4263-8afe-444448820bd5	EMP-102	Nhân viên 102	079099000102	ACTIVE	2026-09-30 03:57:53.046	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8a44eeeb-3034-4ec3-8698-42bf88b0bdd4	EMP-103	Nhân viên 103	079099000103	ACTIVE	2026-09-30 03:57:53.047	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
be5a4d4b-b722-4829-bd88-76090525246d	EMP-104	Nhân viên 104	079099000104	ACTIVE	2026-09-30 03:57:53.048	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6701693f-a487-479f-b4db-8de8e6661c85	EMP-105	Nhân viên 105	079099000105	ACTIVE	2026-09-30 03:57:53.049	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
0f5856c8-f416-4cc3-8c24-37bee79b985e	EMP-106	Nhân viên 106	079099000106	ACTIVE	2026-09-30 03:57:53.05	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d20eb7be-579d-4621-9257-aa4714a618ea	EMP-107	Nhân viên 107	079099000107	ACTIVE	2026-09-30 03:57:53.052	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9169bda2-2ce6-4bc1-9467-8a8f9d166251	EMP-108	Nhân viên 108	079099000108	ACTIVE	2026-09-30 03:57:53.053	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3ede2def-fa99-4369-ab5a-98c9ceafef22	EMP-109	Nhân viên 109	079099000109	ACTIVE	2026-09-30 03:57:53.053	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c3b820f8-6353-4672-b524-1fdd29f9e419	EMP-110	Nhân viên 110	079099000110	ACTIVE	2026-09-30 03:57:53.054	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
b9958656-2301-419f-9419-e5cf4346c770	EMP-111	Nhân viên 111	079099000111	ACTIVE	2026-09-30 03:57:53.055	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fa0810d6-b066-4018-85fd-f9febf6c9945	EMP-112	Nhân viên 112	079099000112	ACTIVE	2026-09-30 03:57:53.056	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
487fc3c1-7057-4ebf-b88b-c516b760af28	EMP-113	Nhân viên 113	079099000113	ACTIVE	2026-09-30 03:57:53.057	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
d4343ced-fed3-4012-b326-ba2b56ad8c10	EMP-114	Nhân viên 114	079099000114	ACTIVE	2026-09-30 03:57:53.059	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
53bde1ff-943a-491c-bc5e-1fe71cfde9c6	EMP-115	Nhân viên 115	079099000115	ACTIVE	2026-09-30 03:57:53.06	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e10e4891-020a-42af-a6b0-f8eacb16a900	EMP-116	Nhân viên 116	079099000116	ACTIVE	2026-09-30 03:57:53.061	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6ae81d90-3cc0-4952-8453-6a4ad0d8689c	EMP-117	Nhân viên 117	079099000117	ACTIVE	2026-09-30 03:57:53.063	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
849954dc-60c5-4eb2-975b-18206631c82c	EMP-118	Nhân viên 118	079099000118	ACTIVE	2026-09-30 03:57:53.064	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
9a4ace15-d335-4f18-b950-3104ec60738e	EMP-119	Nhân viên 119	079099000119	ACTIVE	2026-09-30 03:57:53.065	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
3d013a4e-9e4e-43e6-87b8-e58a4a931b15	EMP-120	Nhân viên 120	079099000120	ACTIVE	2026-09-30 03:57:53.066	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bdc52790-0176-4c10-9fbe-f93989cf95d0	EMP-121	Nhân viên 121	079099000121	ACTIVE	2026-09-30 03:57:53.067	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
a3c43080-5439-42c3-bc14-0acafeb51ac3	EMP-122	Nhân viên 122	079099000122	ACTIVE	2026-09-30 03:57:53.068	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
e50e4c4a-f478-493b-9189-b44091e70e84	EMP-123	Nhân viên 123	079099000123	ACTIVE	2026-09-30 03:57:53.069	38a67124-ab63-41b5-9c38-0352b2df8017	6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
806e5d99-172a-4559-a3a9-016a7a83b0a3	EMP-124	Nhân viên 124	079099000124	ACTIVE	2026-09-30 03:57:53.07	85df4952-a83f-4e53-be36-cce9bf171acf	0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6e7679f1-6486-41d9-990f-f40f94b5b881	NV3442	Đặng Đức Phúc	034204010503	PROBATION	2026-10-01 00:00:00	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e	df3d88a4-0548-4c45-9a29-7a85cb0b456d	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
075505bf-61f1-435f-8d29-a68c4c32eee3	NV7314	Nguyễn Văn Test	001099887766	PROBATION	2026-10-15 00:00:00	2272c377-9ea5-48b0-b1d5-6a6c87c02a4f	d59e6143-12dc-494d-883e-6507dd336b9c	Số 12 Phố Duy Tân, Cầu Giấy, Hà Nội	1998-05-20 00:00:00	candidate.test@lla.vn	MALE	0987654321	998877665544	Vietcombank	Nguyễn Văn Bố	0911223344	Bố đẻ	\N	SINGLE	Việt Nam	BH998811	8899112233
\.


--
-- Data for Name: EmploymentHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."EmploymentHistory" (id, "employeeId", "departmentId", "positionId", "changeReason", "effectiveDate", salary, "createdAt") FROM stdin;
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Holiday" (id, date, name) FROM stdin;
\.


--
-- Data for Name: InterviewRound; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InterviewRound" (id, "candidateId", "interviewerId", "roundName", "scheduledAt", status, location, "createdAt", "expiresAt", "candidateResponse", "respondedAt") FROM stdin;
0df3e7bf-2cf5-460e-ac4c-42e7d0a38d82	b6d0e3d7-558e-431e-875c-3faaa35cbc85	A trúc	Phỏng vấn Kỹ thuật	2018-04-11 09:44:00	PENDING_CONFIRMATION	\N	2026-10-09 09:48:47.866	2026-10-10 09:48:47.866	\N	\N
d065ed35-238c-4b77-a9f2-955fcd88c3b9	0e38cd3b-acfc-4f81-9816-4bf69f597477	gh	Phỏng vấn Kỹ thuật	2026-10-01 13:40:00	PENDING_CONFIRMATION	\N	2026-10-09 09:48:47.866	2026-10-10 09:48:47.866	\N	\N
8f5af878-1d9b-4af6-8736-e3b1e6718014	e763860e-d6e3-4427-8862-516bd2cc96ff	56	Phỏng vấn Kỹ thuật	2026-10-09 04:10:00	PENDING_CONFIRMATION	Trực tuyến (Google Meet / Zoom)	2026-10-09 04:10:29.409	2026-10-10 04:10:29.409	\N	\N
3157eb78-8be7-47fe-ae37-536a7e2dd275	49d93e09-d807-4f2e-891a-592c3dc57b17	Anh Tuấn (Tech Lead)	Phỏng vấn Kỹ thuật & Live Coding	2026-10-10 07:00:00	CONFIRMED	Google Meet: meet.google.com/lla-tech-interview	2026-10-09 10:05:23.682	2026-10-10 04:29:43.814	Ứng viên xác nhận tham gia phỏng vấn đúng giờ	2026-10-09 04:30:11.45
\.


--
-- Data for Name: JobOffer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JobOffer" (id, "candidateId", "baseSalary", "probationRate", "startDate", status, "contractType", "declineReason", notes, "respondedAt", "createdAt", "expiresAt") FROM stdin;
4e37f9f5-8554-42eb-99ed-f9fc15d9f012	4277e2ad-21b2-4e56-99c5-bb8b9ba135b5	18000000.000000000000000000000000000000	85	2026-10-15	ACCEPTED	PROBATION	\N	Thư mời làm việc chính thức tại vị trí Chuyên viên Digital Marketing	2026-10-08 04:18:38.15	2026-10-09 16:58:26.115631	\N
33040bf2-6add-4f3d-a8f5-48753fc00b13	7023b75b-1e8b-4459-a684-5beee979f8b7	15000000.000000000000000000000000000000	85	2026-10-15	PENDING	PROBATION	\N	Chào mừng bạn gia nhập đội ngũ Công ty TNHH LLA!	\N	2026-10-09 16:58:26.115631	\N
bcba7716-16f7-4cdb-bf0b-ed7cd20ebe32	49d93e09-d807-4f2e-891a-592c3dc57b17	25000000.000000000000000000000000000000	85	2026-10-16	PENDING	PROBATION	\N	Chúc mừng bạn đã xuất sắc vượt qua các vòng phỏng vấn! Mời bạn gia nhập LLA HRM Enterprise.	\N	2026-10-09 16:58:26.115631	\N
\.


--
-- Data for Name: JobPosting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."JobPosting" (id, title, description, amount, deadline, status, "salaryRange", "jobType", level, "departmentId", "positionId", "experienceLevel", location, "recruiterName", "recruitmentReason", "targetStartDate", "workplaceType") FROM stdin;
849c60ff-7842-43e9-8fb2-51173c72e319	Tuyển gấp Lập trình viên Frontend (Junior)	Yêu cầu kinh nghiệm làm việc đối với vị trí Lập trình viên Frontend (Junior). Đảm bảo hoàn thành đúng deadline và hòa nhập tốt với văn hóa công ty.	3	2026-10-03 07:08:58.006	PUBLISHED	5,000,000 - 30,000,000	Full-time	Junior	3b6e8018-8b99-4837-9f2a-63bed98e75f2	0b9c56e4-b5e2-4507-98a4-64d7602bad93	Không yêu cầu	Hà Nội	\N	EXPANSION	\N	On-site
24a36872-8805-40bf-9e13-0adebef3f833	Senior Backend Developer (Lương tới 30M)	Yêu cầu kinh nghiệm làm việc đối với vị trí Lập trình viên Backend Cao cấp (Senior). Đảm bảo hoàn thành đúng deadline và hòa nhập tốt với văn hóa công ty.	1	2026-10-03 07:08:58.052	PUBLISHED	5,000,000 - 30,000,000	Full-time	Senior	3b6e8018-8b99-4837-9f2a-63bed98e75f2	eefc6e2c-e94e-40a8-8cdf-eee97dba61a4	Không yêu cầu	Hà Nội	\N	EXPANSION	\N	On-site
acd593b0-8d1e-44eb-8ec8-df4ca94985d5	Tuyển 5 Tester (Junior) đi làm ngay	Yêu cầu kinh nghiệm làm việc đối với vị trí Nhân viên Tester (Junior). Đảm bảo hoàn thành đúng deadline và hòa nhập tốt với văn hóa công ty.	5	2026-10-03 07:08:58.055	PUBLISHED	5,000,000 - 30,000,000	Full-time	Junior	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e	df3d88a4-0548-4c45-9a29-7a85cb0b456d	Không yêu cầu	Hà Nội	\N	EXPANSION	\N	On-site
8485cdcf-56ad-4749-9f03-4b5bc258f1b7	Fresher Business Analyst (Được đào tạo)	Yêu cầu kinh nghiệm làm việc đối với vị trí Chuyên viên Phân tích (Fresher). Đảm bảo hoàn thành đúng deadline và hòa nhập tốt với văn hóa công ty.	2	2026-10-03 07:08:58.058	PUBLISHED	5,000,000 - 30,000,000	Full-time	Fresher	5aa9188c-2788-495f-9ee7-65402db0856a	35009e53-852e-48ba-9acd-bbc5ec1602f9	Không yêu cầu	Hà Nội	\N	EXPANSION	\N	On-site
96b5d4a9-c36b-449c-9c4d-d73e38e06f1d	Chuyên viên Digital Marketing	Yêu cầu kinh nghiệm làm việc đối với vị trí Chuyên viên Digital Marketing. Đảm bảo hoàn thành đúng deadline và hòa nhập tốt với văn hóa công ty.	1	2026-10-03 07:08:58.061	PUBLISHED	5,000,000 - 30,000,000	Full-time	Staff	2272c377-9ea5-48b0-b1d5-6a6c87c02a4f	d59e6143-12dc-494d-883e-6507dd336b9c	Không yêu cầu	Hà Nội	\N	EXPANSION	\N	On-site
\.


--
-- Data for Name: KPI; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."KPI" (id, "employeeId", description, target, achieved) FROM stdin;
\.


--
-- Data for Name: KPITemplate; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."KPITemplate" (id, name, department, criteria, weight, status) FROM stdin;
\.


--
-- Data for Name: LeaveBalance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeaveBalance" (id, "employeeId", year, "totalDays", "usedDays") FROM stdin;
\.


--
-- Data for Name: LeavePolicy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeavePolicy" (id, name, type, seniority, "extraDays", "maxDays") FROM stdin;
\.


--
-- Data for Name: LeaveRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeaveRequest" (id, "employeeId", "leaveType", "startDate", "endDate", status, reason, "approverId", "createdAt", "updatedAt") FROM stdin;
5d49bde6-7d26-442b-8383-76e136e1e4ee	5dd59619-3a74-4357-a719-80b8cd6dd323	PAID	2026-09-30 03:57:53.075	2026-09-30 03:57:53.075	PENDING	\N	\N	2026-10-02 14:17:08.739	2026-10-02 14:17:08.739
f8a4afe7-5805-4601-9020-935bc273f885	5dd59619-3a74-4357-a719-80b8cd6dd323	PAID	2026-09-30 03:57:53.083	2026-09-30 03:57:53.083	APPROVED	\N	admin_id	2026-10-02 14:17:08.739	2026-10-02 14:17:08.739
2af3f124-0a4c-4bd1-ad85-d17001dc4fe9	5dd59619-3a74-4357-a719-80b8cd6dd323	PAID	2026-09-30 03:57:53.082	2026-09-30 03:57:53.082	APPROVED	\N	admin_id	2026-10-02 14:17:08.739	2026-10-02 14:17:08.739
e7105835-e82d-4432-beec-faecef082eb7	5dd59619-3a74-4357-a719-80b8cd6dd323	PAID	2026-09-30 03:57:53.081	2026-09-30 03:57:53.081	REJECTED	\N	admin_id	2026-10-02 14:17:08.739	2026-10-02 14:17:08.739
6deaf2ed-777e-4ce3-8d4e-69532c09eafd	5dd59619-3a74-4357-a719-80b8cd6dd323	PAID	2026-09-30 03:57:53.08	2026-09-30 03:57:53.08	APPROVED	\N	admin_id	2026-10-02 14:17:08.739	2026-10-02 14:17:08.739
\.


--
-- Data for Name: LeaveTypeConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LeaveTypeConfig" (id, name, code, "defaultDays", paid, "carryForward", status) FROM stdin;
\.


--
-- Data for Name: OTRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OTRequest" (id, "employeeId", date, "requestHours", "actualHours", status, reason) FROM stdin;
\.


--
-- Data for Name: OnboardingTask; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OnboardingTask" (id, "employeeId", "taskName", category, "isCompleted") FROM stdin;
c03cbb30-1c23-45f4-b127-0a8672ae0eea	6e7679f1-6486-41d9-990f-f40f94b5b881	Thu hồ sơ bản cứng (CCCD, Bằng cấp)	CONTRACT	t
5b92a6b7-ac32-4b3c-b306-3ae0c62b6e14	6e7679f1-6486-41d9-990f-f40f94b5b881	In hợp đồng thử việc	CONTRACT	t
15bae6e8-75e9-45df-a0fb-ba5288eb9dd7	6e7679f1-6486-41d9-990f-f40f94b5b881	Ký hợp đồng & Đóng dấu	CONTRACT	t
ad8cd3d3-a3e1-4f6d-ba2f-39402c50f6dd	6e7679f1-6486-41d9-990f-f40f94b5b881	Tài khoản phần mềm HRM	ACCOUNT	t
6e8bc1be-4b69-4278-9a49-de80cb807e4d	6e7679f1-6486-41d9-990f-f40f94b5b881	Tài khoản Slack / Teams	ACCOUNT	t
543c8c30-801d-435e-9f55-5f7a8a7db2ae	6e7679f1-6486-41d9-990f-f40f94b5b881	Tạo Email công ty	ACCOUNT	t
1dee5387-534d-4dbe-b9d7-3d7b5578daa5	6e7679f1-6486-41d9-990f-f40f94b5b881	Chuẩn bị chỗ ngồi, VPP	EQUIPMENT	t
56e43002-5713-47f5-ae2d-1fb8bdfcc831	6e7679f1-6486-41d9-990f-f40f94b5b881	Cấp màn hình rời	EQUIPMENT	t
1ceb6af5-2f04-4435-80b7-088c5264bb47	6e7679f1-6486-41d9-990f-f40f94b5b881	Cấp phát Laptop/PC	EQUIPMENT	t
\.


--
-- Data for Name: PayrollPeriod; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayrollPeriod" (id, "monthYear", "standardWorkingDays", status) FROM stdin;
783cd7f9-8c80-468a-b6f1-92aab740daaa	10-2026	22	DRAFT
\.


--
-- Data for Name: Payslip; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payslip" (id, "employeeId", "payrollPeriodId", "actualWorkingDays", "baseSalary", "grossSalary", "insuranceDeduction", "taxDeduction", "leaveClawback", "netSalary") FROM stdin;
dbce98aa-d79c-4a11-95d4-8c644c7df22c	5dd59619-3a74-4357-a719-80b8cd6dd323	783cd7f9-8c80-468a-b6f1-92aab740daaa	3.000000000000000000000000000000	10000000.000000000000000000000000000000	1363636.000000000000000000000000000000	143182.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	1220455.000000000000000000000000000000
1a7ca99e-013a-4b3b-94f3-94f3977dcfdb	b2d0a71a-29c3-4e57-b029-71cad44ef8a0	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7cd4b80d-e049-4790-bb70-62086de5e7cf	c18ed12e-e6af-4e09-9e84-30dc7d7dc947	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
8d8e355b-10ba-474c-87a3-bf4c71aac060	3b0ff7d4-3394-49ce-b7c8-3edf7c8e1147	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
ceab5c48-2dfd-4614-8893-81c5087ab42e	c81f9cbc-4195-43a2-9cd9-7147fa8b7c63	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
3b979659-ce25-48b1-a9f9-6b3ce133df5a	fd1042e1-013f-4e49-90d5-b3c6fc384401	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
9d12d5e6-5e0b-409f-b4ef-20eba31327b7	dc7cbe23-c0da-4959-94aa-6ce601dfac4a	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
e8b2873a-2845-4d2d-a5f1-d1a7de7e1b32	72a1ca62-1d35-4e51-9913-0903c8b3c782	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
fdcb3aef-64ae-4fae-89d6-4c69d66d4ec6	10c15b9e-3667-4435-ad56-d35266b6e9c6	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
0787fa39-5ca5-41ae-affc-7f658d18d829	18548c24-00d5-4581-8f68-6481a1d61889	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
2c322bfc-3350-4b85-956f-76fd03fc7e54	377b9a0a-cdfe-48b5-8178-65fa7b814061	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
0505de38-e1d3-46e7-ba9f-3ac59aff8170	572fffb4-00fd-4cc0-b6a3-444604e0fb59	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
cf803fa6-dcc1-4cad-a319-1dcfc520e202	b4e94d0d-5bc6-403d-9e8d-1a63c57cb0ff	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
ca41aa28-9014-4358-8564-922cf7c82683	44d44e1d-fa84-45b0-a3f8-20f1af77df63	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
37de1601-76e8-4e40-bae8-22204513502a	59fe22a6-ba13-4a98-bcd1-0954a0c6a2fc	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
81dfd854-d0bf-4114-bfc6-ea46ae25fc43	d55606f9-f019-4798-917c-4af47388052f	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
5e6b1178-56f4-470f-ac00-085b275fc8e5	59187b3f-bf20-48ff-8248-5c0f92ac33be	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
752ce4a0-576d-42cb-860c-06a9e48719fa	8118f569-4ffe-4e39-92be-5490bd788a15	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
5e9ab2b1-d702-44b4-918e-af71cd502055	4206917a-a4a6-4d34-a0cf-3ad432949725	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
e1a80242-18be-402b-a001-0a58b814de63	e1a4f151-128e-4ff3-a85e-0b8368996c4c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
895a59f7-fd85-4367-910d-4cb44a49b35c	f6016da2-3aba-4c4b-acc8-89aa57abbf55	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7079e173-7fca-49bb-96cb-4086d6a8fd51	e65914d9-39d0-42bc-913f-51d07ded2f69	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
6d2a00e9-f300-4507-be97-654b6b603160	72eb8568-4e78-4ff0-af89-cc883d6fa837	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
fc636b85-f258-4e2e-ab03-c44ffdbc2d28	bcc5e46c-127e-4071-a212-cc5e9cf7483c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7bec086e-d368-498a-97c1-c50ffe1ab8cd	737f5a85-e8fa-45fb-b774-b69b8e25d8f1	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7cc3b145-f75d-4787-a5e9-28540289c50a	ead53793-ad1a-4634-9f96-ec8c3563392f	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
3b2b1d51-1ecb-4021-be33-1c2290af6c8e	aedaeb9e-f4ee-4786-85e1-982a39bc7e84	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
73e076e5-c7d5-46e1-8ce0-04a640402f90	e23db433-a9d1-4ad4-b8a9-df96dfb129aa	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
fd827a39-b098-456d-9d9d-1e2e8ec2e469	9d48b8f1-1c11-49aa-9a90-4ee95c6224e6	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
85e6718b-7adc-4012-aa8e-f784355bc58c	a8a768c3-ebb1-493d-a79c-56282af47331	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
74c6dec5-8def-4c2e-b19f-2dfb809c4776	ddfbf883-9a7e-4b53-9ec9-8abb0781a4ba	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
a9bc4549-283b-49c5-8c96-9c6b649f1e2b	61189529-8f8f-4274-9b22-1c47649d43a2	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
37a67c29-c2d3-43e7-a181-7197f76ba82a	1e010b71-1464-44d2-a3d6-caab34d1f9cf	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
42c3245e-f2c9-4fbf-a352-da94bea610f9	8550586b-17af-469c-8da5-ff884a17decd	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
3695d351-92ca-43e8-8f49-cd641ed1f1c8	14ea2d87-958f-4453-8737-b35a24033a4a	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
af1df814-a44e-4730-9966-0100b36135ff	a9ecadd0-44fb-4702-800f-43fc93c1459c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
c9dad7d4-7db1-4b59-9843-9bfc7b1639e4	05a011df-a0e0-4714-9868-9f18ae82b2e4	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
18208208-c115-4b9a-af40-d3c5d4902dc2	dae88fab-f330-4854-b3b8-2c26d0376468	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
241a4d46-827b-4b07-a4ea-0266fb7c972d	955e828e-566d-453e-8fab-4984bcbbe45c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
0afd0866-a3b7-45d5-9459-ed70b603d85a	7e865b71-f818-4e55-a415-32a3cbdd774e	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
d8682935-1c5f-4844-87bb-b7072fac5ec2	22d63a44-cbfd-42fe-963f-6986c8b88bbc	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
8ba4ec30-812d-4c24-9e0d-c40cdb51e1de	7f418709-06af-4361-a87e-964a7420d69c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
ca9230ee-0e40-414d-8a68-bc296504c528	62616f09-defa-47eb-87da-2c1965c86160	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
f279d08b-b7d0-4430-bd2c-89d0e73a837d	c7acd194-5177-43e9-a8ec-6c43c5e1a69c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
39a13f6f-4600-471e-9455-f731e0cae87e	0ee42e61-c631-46cd-8fa9-4ce3a9818b36	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
032e5bf7-87b5-48a5-accb-938b8a387245	ff2117b9-00db-42ad-87e1-dc6acda64060	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
c70a5f84-3c4a-41c6-8709-04a8a78db6c8	f67f64cb-715d-4837-a428-a69b84a88d4e	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
654a69dd-4b22-43de-81c8-b374fda637ce	c06aa40f-1d63-41bb-90b8-6c5dffeb7287	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
c43712bf-7edd-4a8e-95d9-121185557a2b	37cf4b46-0bdc-4e1e-b66f-884802d56207	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
e1cc0e6e-724a-4dcf-a05b-51cb85b87995	bc3df4a3-ab97-4539-927a-05051871442b	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
e0e2b86c-79a3-4060-8b45-119cf79e56f3	25af354d-3939-4404-91a8-36611bf9805c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
8085b7ec-b489-4d7c-b7c6-ada451502925	e3e766ea-75d1-4add-acef-d78c9d4d3f7c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
c32a69fd-1d83-4405-a497-23e4adfc2443	50924ed3-094a-4a1d-a0b2-b0b9f692541b	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
92d87d24-b58b-4812-a881-0110ddc194bc	c2516302-4fa5-47b9-906b-e37d33ae6f78	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
cb5686da-cb6b-4105-a875-d4b57d890f6b	5e76cac1-a8e3-4269-bacb-619946ae4fac	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
d96bcb09-c7cd-4b6b-b06b-ae203e2a82d9	90937de5-cae5-466b-8971-7f73f83127f2	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
b17ebceb-75cc-40ed-8ed0-0dccff83246a	97f3a150-2585-48d4-b6bd-47d776fd2ba3	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
6dd86ef9-808d-46df-8c45-1e968e6a292a	5b0c7eb3-ba71-43b1-93fa-83d549c045e4	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
076a2d6b-a643-4024-9655-33eb5fcf5c51	eedb262b-0276-40b9-87ff-78dc7098f546	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
737ee799-8434-42e3-bfe4-a3f1c5cc3e51	6df15582-0803-447c-9f62-c1a64611e94c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
b1843edb-3eef-4ee0-b22f-13f0b7f015be	64d3bb0f-a260-4635-b11a-04a9227f7fd2	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
61b66d46-c5be-408c-994b-c3f1a3bf3fc0	77915b24-285e-4f57-ba85-2e48f71cd591	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
ad29bcc7-1818-4fd6-9cb0-3e06ba7af44f	a02afc84-bd96-45cc-9e4a-9457b86e3f86	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
b9f13d4c-459b-40a1-8d89-02a4a175beb4	e69543f1-dabe-4e4a-9a40-a6b918482a94	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
675d7425-87df-4a97-b08c-09aba2805490	44a8b24f-0a95-4e0e-948d-0feadfa145d3	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
77512b5f-cc31-4b90-8ddc-c90b7e5eed0b	89596b00-b2cb-4af7-b311-b3ff8deb9db8	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
59a9a99f-b866-4130-92cb-d2aadd9fd4a3	ecc768b5-d013-489b-8d7e-d112bbc3893a	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
70d5bcaa-2a00-4664-8a61-f404de6b1e0b	c04740d7-ed77-4caf-92f2-ab68be7d0e29	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7e9c5362-c2be-417e-8ff1-a006e1175c40	9571a05f-f6b8-4aaf-8773-f9a3db9c15d1	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
5aa30cb0-3f25-47d9-9bee-a66423815979	b0dc0937-eab0-42f9-b304-dc77bbc1665b	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7357a3a2-bc36-43b5-b1ce-6be5229533bc	a53e5904-26f6-4d1a-b0d3-95ad84a84373	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
ae000eb8-b4ec-4725-bdf4-af79fe98985b	4d567526-e1d3-4627-8ea1-ac05525314ee	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
6de781cb-6245-457e-bc20-1d606432bcc7	fc9d75b1-fbf2-4540-a9f8-79ccdda9f674	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
4d07ef7a-28be-428b-ad74-ddc3b95b395c	70730c83-f821-45ea-ac64-7fa9f38cbe5d	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
dc268680-b90a-4c08-a653-6ed9ea4294ab	74a9e029-8f4f-404d-93f2-666b1cae55f9	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
c655ecff-cf25-4cae-a6a6-903eaffff74c	d08bc8b0-bfac-420f-a0d0-93081726b51f	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
763d0b24-4257-421f-a563-79e7c9c9a951	62e8bce4-d380-4011-9cd0-1f8ad41ca6a4	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
f9086f44-1d84-4d76-91e3-90941630559d	4a8bfa2a-ebe0-4dd8-bedf-4f20bd9e3c05	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
703713fe-4cab-4d8a-b272-807048805d49	18f6599c-2d2f-495a-9112-5e62615348eb	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
68b5ca74-05b4-42f1-9f04-558dcb41bddd	079d9ff1-f4a4-4377-b474-b675bdbed58c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
0668c70b-b281-4260-8545-d192c783b495	fc09b3b8-fa7d-47ce-8334-251329fcf010	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
dd42e67c-a8be-41e3-ab19-b3e9a62c2ade	8dfdd822-3b46-4078-98b6-ab890781381e	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7d5c7319-f196-45f8-b240-934a1db7cec3	0da21e65-7c52-4dc4-beb5-110d6c9cbe9b	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
932d727b-fd2d-419d-83f0-41e165efd3d9	ee9b66cf-3dc7-46b5-9e7c-a33f0499bb58	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
f736b878-1f46-4d21-a9bf-9de62f7eba68	876f082d-2917-4d15-92da-835933cec5cc	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
9ccb3897-bb5f-4906-b17d-e4eb5bfbcbc4	be02b874-bc97-4b94-bca5-75bf75a4633d	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
63530ad9-d4eb-4dd9-9f9d-506db6fdbbe1	32f7c531-0438-472e-8573-94e6ea505a04	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
e8bec800-cb84-4bd4-bab3-576759848d66	3b35c736-0a1d-40e8-a5d3-8ea3f6661d69	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
610da465-bc38-41e7-8449-3e58ea22f9f6	b2dcf89e-2e7c-402f-8403-1c8c8915f019	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
3722209d-692f-4219-8542-bd124989eac9	a2c74307-5afc-484a-9184-ec9d36c07f05	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
10da4b60-938b-4b31-bfb4-c43d065ba327	864afd8e-ddbd-4f36-9893-2521e8007547	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
a8983c01-0805-4fa2-a22a-ffe41f939aad	f279ec9f-06a5-46b2-9253-a1edf7ffa43b	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
94788e51-cfd0-4ac1-b394-9251b2fad6e3	abf944d6-1050-4f08-9731-007492acdb45	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
780fbaf5-8e40-4a17-90b4-9247d3daa8a8	2d5a98c0-e8bd-4cf8-ae69-44100786baf3	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
8cb4c552-3359-4443-8b0b-6cd47de0460d	5f307547-a5e7-42f1-a2d1-926ed0523bcf	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
d8ab2a52-4c8d-407a-b9c0-a797c4dc1ce8	68d45f9d-6834-453d-9f58-af798e43e5ba	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
91030e9d-3ec9-4555-9d2a-8406c3360a5f	10c3a112-0761-4065-b370-b16901f58620	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
177e666a-33c1-45c2-a7b4-4772000c2212	142e9d34-2acd-48a3-ab0f-e785dd2d4e05	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
44697920-2cea-42bc-9879-5976f3b6c267	beeeba07-b2ad-4f32-a5b7-c3feef4e3210	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
6ad490b8-50f9-4e94-bac6-81b5c8eec64a	fc5360b6-5ca9-4bbb-a0eb-f5ff4a11fb16	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
44c71664-be7a-443d-9924-a2f8a5c1beb3	fb8714ec-e7fd-43f2-9ac9-d8130d882422	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
d6105a61-0495-4079-bb04-4c01272c6c9a	e9bdd481-4c28-4399-ab4d-ea9aa0fab281	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
28c89ec4-43e3-4eea-9d7b-591607c095a6	7b617691-648c-45bc-a761-1172aff3821a	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
f95b01d4-33b7-4089-b6e2-6e7deb3b6e9b	a87278c6-ec55-40fd-b135-d106441c5a6c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
f3edd4c3-ac01-4cb1-a983-1a62cbf36962	4565888c-315d-4aaf-8b6d-7eb94360e8fb	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
dfc584ba-a6ed-4547-8e62-87d0fe7fba9f	ca93849b-12bb-4795-bf12-d592a59631f7	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
0979ce08-fc93-4dcc-a651-a52646f55fac	78b2e885-7052-48ec-b0f0-c63bf9f3bb22	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
30bbdfdb-f02d-4f12-b9b9-b65fe79385b0	b194f8f5-5517-4e82-b309-e3d6d527f9e5	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
6105fa10-8206-459d-a382-beb1b6d54c39	689306c8-fa09-4263-8afe-444448820bd5	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
354397cc-a609-4ce4-ac64-59696e15b542	8a44eeeb-3034-4ec3-8698-42bf88b0bdd4	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
b65ed002-f8c4-4dab-b1fa-df288cd01adb	be5a4d4b-b722-4829-bd88-76090525246d	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
15d65886-5bc3-42b4-91c6-4dc80a54a2f4	6701693f-a487-479f-b4db-8de8e6661c85	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
6de26348-4543-40a4-a6b4-49d58e041ee9	0f5856c8-f416-4cc3-8c24-37bee79b985e	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
782341a9-8574-468a-9b18-6cdcc14d45c6	d20eb7be-579d-4621-9257-aa4714a618ea	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
d24369c7-0a01-4761-861c-dc3268768220	9169bda2-2ce6-4bc1-9467-8a8f9d166251	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
389ae9b1-9380-4a39-85b4-d42aaa198dbf	3ede2def-fa99-4369-ab5a-98c9ceafef22	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
c17d7270-24b5-4ab1-9909-a2ca3020d70f	c3b820f8-6353-4672-b524-1fdd29f9e419	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
74bfa16c-37ee-4067-a41c-de47b5b9ee84	b9958656-2301-419f-9419-e5cf4346c770	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
4da73848-36c7-4fbb-b556-f1af37b28245	fa0810d6-b066-4018-85fd-f9febf6c9945	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
e1e0166f-7ef1-4eb9-b54f-70024adf7693	487fc3c1-7057-4ebf-b88b-c516b760af28	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
a2002695-5082-4a40-9750-e8e0ea3ba01b	d4343ced-fed3-4012-b326-ba2b56ad8c10	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
f824a80d-5bfa-4f32-a769-7a99df873d9a	53bde1ff-943a-491c-bc5e-1fe71cfde9c6	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
18abce47-5314-480f-a80e-2371f17e6d9e	e10e4891-020a-42af-a6b0-f8eacb16a900	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
1659b478-0058-4812-b974-0b0ac964a56f	6ae81d90-3cc0-4952-8453-6a4ad0d8689c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
8db95e7c-abc3-48b1-af59-f040b1be4616	849954dc-60c5-4eb2-975b-18206631c82c	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
fd886a65-9362-49f5-b2b0-e86c6fa804c8	9a4ace15-d335-4f18-b950-3104ec60738e	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
8e3294ac-0d09-4f8a-b61f-ae6394118451	3d013a4e-9e4e-43e6-87b8-e58a4a931b15	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
4decc77f-5c26-4def-ab3e-c571c99cd164	bdc52790-0176-4c10-9fbe-f93989cf95d0	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
7c41a8e9-0395-4a8e-b6fa-6d6fb3e0f0ac	a3c43080-5439-42c3-bc14-0acafeb51ac3	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
68139f5b-93e1-4f87-aae5-6e4c4e84d23d	e50e4c4a-f478-493b-9189-b44091e70e84	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
cc9dfa0d-158c-4fdc-adfe-08ee2e0261f6	806e5d99-172a-4559-a3a9-016a7a83b0a3	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	10000000.000000000000000000000000000000	10000000.000000000000000000000000000000	1050000.000000000000000000000000000000	0.000000000000000000000000000000	0.000000000000000000000000000000	8950000.000000000000000000000000000000
fd1abf46-344a-451a-ad18-fb59799436f4	6e7679f1-6486-41d9-990f-f40f94b5b881	783cd7f9-8c80-468a-b6f1-92aab740daaa	22.000000000000000000000000000000	15000000.000000000000000000000000000000	15000000.000000000000000000000000000000	1575000.000000000000000000000000000000	121250.000000000000000000000000000000	0.000000000000000000000000000000	13303750.000000000000000000000000000000
\.


--
-- Data for Name: PayslipDetail; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PayslipDetail" (id, "payslipId", type, amount, description) FROM stdin;
\.


--
-- Data for Name: PerformanceReview; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PerformanceReview" (id, "employeeId", "reviewCycleId", score, comments) FROM stdin;
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Permission" (id, action, description) FROM stdin;
\.


--
-- Data for Name: Position; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Position" (id, code, title, description, level, "minSalary", "maxSalary", status, "departmentId") FROM stdin;
0a399222-bf64-4bd3-96bf-6157be73e3e4	PGD	Phó Giám đốc	\N	Manager	10000000	50000000	ACTIVE	6f7fa8e2-e829-4544-a063-48ce099d7af1
31de6775-688d-4ab1-a9e1-433811c976a3	TPSX	Trưởng phòng Sản xuất	\N	Manager	10000000	50000000	ACTIVE	d9931a3b-7089-4fd8-a852-27bc37e3ee61
4b3186e9-a99b-4fee-8c63-6f8ce9dc0c8a	KTT	Kế toán trưởng	\N	Manager	10000000	50000000	ACTIVE	de156231-1c54-4603-889c-51a0bd186848
a253a8d3-0554-4634-830c-2ec1199a15ba	GD	Giám đốc	\N	Manager	10000000	50000000	ACTIVE	6f7fa8e2-e829-4544-a063-48ce099d7af1
609f40b4-316b-4df0-9aeb-bf17b43f8c68	MKT_MGR	Trưởng phòng Marketing	\N	Manager	5000000	30000000	ACTIVE	2272c377-9ea5-48b0-b1d5-6a6c87c02a4f
d59e6143-12dc-494d-883e-6507dd336b9c	MKT_DIGITAL	Chuyên viên Digital Marketing	\N	Staff	5000000	30000000	ACTIVE	2272c377-9ea5-48b0-b1d5-6a6c87c02a4f
964760ed-49b7-4d71-9550-a5e1b4caefc5	MKT_DES	Nhân viên Thiết kế (Designer)	\N	Staff	5000000	30000000	ACTIVE	2272c377-9ea5-48b0-b1d5-6a6c87c02a4f
693438e7-c988-429f-9dea-9fdaf61ed3f5	HT_MGR	Trưởng khối Hạ tầng	\N	Manager	5000000	30000000	ACTIVE	beff8ce4-22e9-4573-8e10-d9aa339513fe
5ce315ff-5fdb-41d0-83ff-f7dfbed2cee3	HT_HELP	IT Helpdesk	\N	Staff	5000000	30000000	ACTIVE	beff8ce4-22e9-4573-8e10-d9aa339513fe
41bfe7bb-5a10-441e-8194-6e33631cfcca	HT_NET	Kỹ sư mạng	\N	Staff	5000000	30000000	ACTIVE	beff8ce4-22e9-4573-8e10-d9aa339513fe
14f4deab-b0e5-4a98-997f-805433df499a	KT_TH	Kế toán tổng hợp	\N	Staff	5000000	30000000	ACTIVE	de156231-1c54-4603-889c-51a0bd186848
85c867a8-2007-40c3-bcce-c01eb6ff81be	DEV_FE_0	Thực tập sinh Frontend (Intern)	\N	Intern	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
75196adb-aa70-40aa-8149-23bc1d9737b2	DEV_FE_1	Lập trình viên Frontend (Fresher)	\N	Fresher	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
0b9c56e4-b5e2-4507-98a4-64d7602bad93	DEV_FE_2	Lập trình viên Frontend (Junior)	\N	Junior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
36929005-a14d-442a-9fbf-153ee9899039	DEV_FE_3	Lập trình viên Frontend (Middle)	\N	Middle	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
d40a6999-827e-4676-bea4-8d3e5f278ffb	DEV_FE_4	Lập trình viên Frontend Cao cấp (Senior)	\N	Senior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
37abe207-cb46-45ef-bf5d-f789f624d40e	DEV_BE_0	Thực tập sinh Backend (Intern)	\N	Intern	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
a7c9dd29-050f-4b6b-8519-1cd8a45e7da0	DEV_BE_1	Lập trình viên Backend (Fresher)	\N	Fresher	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
d3ce67d5-b63f-458c-9a91-3284b6a5ce07	DEV_BE_2	Lập trình viên Backend (Junior)	\N	Junior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
163e1747-1f8e-42e7-9ef9-a23c3445e5a6	DEV_BE_3	Lập trình viên Backend (Middle)	\N	Middle	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
eefc6e2c-e94e-40a8-8cdf-eee97dba61a4	DEV_BE_4	Lập trình viên Backend Cao cấp (Senior)	\N	Senior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
8e16e0f1-8042-40be-8e1b-da7c8c70dc77	DEV_MB_0	Thực tập sinh Mobile (Intern)	\N	Intern	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
b6c6518e-15e3-46bb-82b8-c53b1e165b17	DEV_MB_1	Lập trình viên Mobile (Fresher)	\N	Fresher	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
38aefb21-4166-4b35-a0d1-07c1f3b1e0e9	DEV_MB_2	Lập trình viên Mobile (Junior)	\N	Junior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
cbd69e4a-d9e5-48f9-90bd-904715172ba1	DEV_MB_3	Lập trình viên Mobile (Middle)	\N	Middle	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
42e50c72-af62-445c-b085-c1926fd103ec	DEV_MB_4	Lập trình viên Mobile Cao cấp (Senior)	\N	Senior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
9f9cbdc0-565c-4bc7-a814-c75488a006f2	DEV_OPS_2	Chuyên viên DevOps (Junior)	\N	Junior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
6becd3dc-28f8-4ef0-b10f-af59051b53ed	DEV_OPS_3	Chuyên viên DevOps (Middle)	\N	Middle	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
8632e3bd-3aeb-40e4-bcd2-84364b884c27	DEV_OPS_4	Chuyên viên DevOps Cao cấp (Senior)	\N	Senior	5000000	30000000	ACTIVE	3b6e8018-8b99-4837-9f2a-63bed98e75f2
96de60b9-6808-4d3d-93e6-3c5673e1393b	TEST_MN_0	Thực tập sinh (Intern)	\N	Intern	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
64fc550a-c86e-4d3f-a3a9-504f6769f3ea	TEST_MN_1	Nhân viên Tester (Fresher)	\N	Fresher	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
df3d88a4-0548-4c45-9a29-7a85cb0b456d	TEST_MN_2	Nhân viên Tester (Junior)	\N	Junior	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
486f4d03-6a00-40c7-a631-1c12bbeb4a91	TEST_MN_3	Nhân viên Tester (Middle)	\N	Middle	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
89e44c82-e05d-4c55-a8de-c0c22e283af1	TEST_MN_4	Chuyên viên Tester Cao cấp (Senior)	\N	Senior	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
b9976293-6c7f-4e72-919d-e65db855ec8b	TEST_AUTO_2	Kỹ sư Test Tự động (Junior)	\N	Junior	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
628c68bc-26b0-4613-a333-263ff16b4c8d	TEST_AUTO_3	Kỹ sư Test Tự động (Middle)	\N	Middle	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
0e0c3fcc-3efe-474e-a6d3-e852fc46d778	TEST_AUTO_4	Kỹ sư Test Tự động Cao cấp (Senior)	\N	Senior	5000000	30000000	ACTIVE	eb51497c-6ddd-454b-b56f-b5ebd54a3b0e
1966eb15-3697-4e57-a26b-1e16d1cc56a9	BA_0	Thực tập sinh BA (Intern)	\N	Intern	5000000	30000000	ACTIVE	5aa9188c-2788-495f-9ee7-65402db0856a
35009e53-852e-48ba-9acd-bbc5ec1602f9	BA_1	Chuyên viên Phân tích (Fresher)	\N	Fresher	5000000	30000000	ACTIVE	5aa9188c-2788-495f-9ee7-65402db0856a
2785bf3b-7182-4c78-a467-ba090d0445ec	BA_2	Chuyên viên Phân tích (Junior)	\N	Junior	5000000	30000000	ACTIVE	5aa9188c-2788-495f-9ee7-65402db0856a
f0b610a0-72b8-4eb8-9ecb-a7172f149aea	MKT_CONTENT	Chuyên viên Content	\N	Staff	5000000	30000000	ACTIVE	2272c377-9ea5-48b0-b1d5-6a6c87c02a4f
24b49de1-5ec9-4406-beb4-9f415fa3d31f	BA_3	Chuyên viên Phân tích (Middle)	\N	Middle	5000000	30000000	ACTIVE	5aa9188c-2788-495f-9ee7-65402db0856a
992f5e99-6357-4cef-9224-ad0b80aa3174	BA_4	Chuyên viên Phân tích Cao cấp (Senior)	\N	Senior	5000000	30000000	ACTIVE	5aa9188c-2788-495f-9ee7-65402db0856a
0e9e2bcb-20b6-4b17-a10f-8eff3957f1dd	\N	Lập trình viên	\N	Staff	0	0	ACTIVE	\N
6216002c-8963-4f26-9fb1-3b5e0d056a0b	\N	Chuyên viên HR	\N	Staff	0	0	ACTIVE	\N
\.


--
-- Data for Name: PreOnboardingProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PreOnboardingProfile" (id, "candidateId", cccd, gender, "dateOfBirth", address, nationality, "maritalStatus", "taxCode", "bankName", "bankAccount", "socialInsurance", "healthInsurance", "emergencyContactName", "emergencyContactPhone", "emergencyContactRelation", "submittedAt") FROM stdin;
40c0d4d3-28e7-4b06-a880-e62242884f71	4277e2ad-21b2-4e56-99c5-bb8b9ba135b5	001099887766	MALE	1998-05-20 00:00:00	Số 12 Phố Duy Tân, Cầu Giấy, Hà Nội	Việt Nam	SINGLE	8899112233	Vietcombank	998877665544	BH998811	\N	Nguyễn Văn Bố	0911223344	Bố đẻ	2026-10-08 04:18:38.153
\.


--
-- Data for Name: Relative; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Relative" (id, "employeeId", "fullName", relation, "dateOfBirth", "taxCode", "isDependent") FROM stdin;
\.


--
-- Data for Name: ReviewCycle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ReviewCycle" (id, name, "startDate", "endDate") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Role" (id, name, description) FROM stdin;
338201fb-f22d-4b41-a005-2c82ebf0a7a4	ADMIN	Quản trị viên hệ thống
a9e38fc6-58ef-4d65-8133-6f0b34d26cb7	EMPLOYEE	Nhân viên bình thường
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RolePermission" ("roleId", "permissionId") FROM stdin;
\.


--
-- Data for Name: Shift; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Shift" (id, name, "startTime", "endTime", "breakTime", "isActive", "workHours") FROM stdin;
dfd7f570-3964-4f68-bd8a-e7b64b6516a8	Ca Hành chính	08:00	17:30	12:00 - 13:30	t	8.000000000000000000000000000000
e8da7cfe-dce6-4219-90c3-917b1c8c2fe4	Ca Sáng (Part-time)	08:00	12:00	\N	t	4.000000000000000000000000000000
c583aee8-ec13-4021-ab7d-f3c62f983b44	Ca Chiều (Part-time)	13:30	17:30	\N	t	4.000000000000000000000000000000
dc8b1cec-4b84-4366-81f2-690b430f12d4	Ca Đêm (Bảo vệ)	22:00	06:00	02:00 - 03:00	f	7.000000000000000000000000000000
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemSetting" (id, category, key, name, value, "dataType", description, unit, "updatedAt") FROM stdin;
66472756-4b24-40ad-92e0-e9d72a61cef4	PAYROLL	INSURANCE_RATE	Tỷ lệ trích BHXH, BHYT, BHTN của người lao động	10.5	PERCENT	Bao gồm BHXH 8%, BHYT 1.5%, BHTN 1% trừ trực tiếp vào lương tháng.	%	2026-10-07 01:48:01.624
66f6ca95-8174-4ab2-8684-18bfe70608d6	PAYROLL	PERSONAL_DEDUCTION	Mức giảm trừ gia cảnh bản thân (Thuế TNCN)	11000000	NUMBER	Mức miễn trừ tính thuế TNCN cho cá nhân người nộp thuế theo Luật Thuế TNCN hiện hành.	VNĐ / tháng	2026-10-07 01:48:01.64
f4f95169-56a4-40b0-957c-db4766f8898a	PAYROLL	DEPENDENT_DEDUCTION	Mức giảm trừ mỗi người phụ thuộc	4400000	NUMBER	Mức giảm trừ cho mỗi người phụ thuộc có đăng ký MST hợp lệ.	VNĐ / người / tháng	2026-10-07 01:48:01.642
1c7272a3-8074-4ed3-9454-a172c11c9f83	PAYROLL	MAX_INSURANCE_SALARY	Mức trần lương tính đóng BHXH bắt buộc	46800000	NUMBER	Tương đương 20 lần mức lương cơ sở (2.340.000 VNĐ x 20).	VNĐ	2026-10-07 01:48:01.644
51066ee0-de98-4259-9a58-06ec6f683821	PAYROLL	PAYROLL_CUTOFF_DAY	Ngày chốt bảng chấm công hàng tháng	25	NUMBER	Chu kỳ tính lương chốt từ ngày 26 tháng trước đến ngày 25 tháng này.	Hàng tháng	2026-10-07 01:48:01.647
480c4b09-6088-42f8-a5b0-50ec7faae780	ATTENDANCE	OT_RATE_NORMAL	Hệ số lương làm thêm giờ ngày làm việc thường	150	PERCENT	Tối thiểu 150% theo Điều 98 Bộ luật Lao động.	%	2026-10-07 01:48:01.648
8a79911e-6eca-4db0-bfd4-4e9cf5aac300	ATTENDANCE	OT_RATE_WEEKEND	Hệ số lương làm thêm giờ ngày nghỉ hàng tuần	200	PERCENT	Tối thiểu 200% áp dụng vào ngày Thứ 7, Chủ nhật.	%	2026-10-07 01:48:01.65
0e3a282b-7e6c-40da-8f10-e4924fd74b09	ATTENDANCE	OT_RATE_HOLIDAY	Hệ số lương làm thêm giờ ngày Lễ, Tết có hưởng lương	300	PERCENT	Tối thiểu 300% chưa kể tiền lương ngày lễ đối với người lao động hưởng lương ngày.	%	2026-10-07 01:48:01.651
98d69c18-5c79-40f3-8be5-dd5f28dfa486	HR	LEAVE_APPROVAL_THRESHOLD	Ngưỡng ngày nghỉ phép phân cấp Tổng Giám Đốc phê duyệt	2	NUMBER	Đơn xin nghỉ từ mức ngày này trở lên bắt buộc phải qua cấp TGĐ/CEO duyệt sau Trưởng phòng.	Ngày	2026-10-07 01:48:01.653
4c16728f-0fcd-4879-8e5e-7ac3869956d8	HR	CONTRACT_EXPIRY_WARN_DAYS	Thời gian cảnh báo trước hạn Hợp đồng lao động	30	NUMBER	Hệ thống tự động hiển thị danh sách hợp đồng sắp hết hạn để chuẩn bị tái ký.	Ngày	2026-10-07 01:48:01.654
d02fdd6a-48ea-4a4c-a5d2-d02c3fd0da18	HR	PROBATION_PERIOD_DAYS	Thời gian thử việc tiêu chuẩn chức danh đại học/chuyên viên	60	NUMBER	Thời gian thử việc tối đa theo quy định pháp luật lao động.	Ngày	2026-10-07 01:48:01.656
6854e29e-d4fb-4653-9611-4c6375cde610	PAYROLL	STANDARD_WORKING_DAYS	Số ngày công chuẩn trung bình tháng	22	NUMBER	Số ngày công định mức trong tháng làm căn cứ chia đơn giá ngày lương.	Ngày	2026-10-07 01:52:30.747
\.


--
-- Data for Name: TaxBracket; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TaxBracket" (id, tier, "minIncome", "maxIncome", "taxRate") FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Allowance Allowance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Allowance"
    ADD CONSTRAINT "Allowance_pkey" PRIMARY KEY (id);


--
-- Name: AssetAssignment AssetAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssetAssignment"
    ADD CONSTRAINT "AssetAssignment_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceAdjustment AttendanceAdjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceAdjustment"
    ADD CONSTRAINT "AttendanceAdjustment_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: CandidateFeedback CandidateFeedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CandidateFeedback"
    ADD CONSTRAINT "CandidateFeedback_pkey" PRIMARY KEY (id);


--
-- Name: CandidateUser CandidateUser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CandidateUser"
    ADD CONSTRAINT "CandidateUser_pkey" PRIMARY KEY (id);


--
-- Name: Candidate Candidate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_pkey" PRIMARY KEY (id);


--
-- Name: Certificate Certificate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_pkey" PRIMARY KEY (id);


--
-- Name: Contract Contract_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_pkey" PRIMARY KEY (id);


--
-- Name: Decision Decision_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Decision"
    ADD CONSTRAINT "Decision_pkey" PRIMARY KEY (id);


--
-- Name: Degree Degree_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Degree"
    ADD CONSTRAINT "Degree_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: EmploymentHistory EmploymentHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmploymentHistory"
    ADD CONSTRAINT "EmploymentHistory_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: InterviewRound InterviewRound_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InterviewRound"
    ADD CONSTRAINT "InterviewRound_pkey" PRIMARY KEY (id);


--
-- Name: JobOffer JobOffer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobOffer"
    ADD CONSTRAINT "JobOffer_pkey" PRIMARY KEY (id);


--
-- Name: JobPosting JobPosting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobPosting"
    ADD CONSTRAINT "JobPosting_pkey" PRIMARY KEY (id);


--
-- Name: KPITemplate KPITemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KPITemplate"
    ADD CONSTRAINT "KPITemplate_pkey" PRIMARY KEY (id);


--
-- Name: KPI KPI_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KPI"
    ADD CONSTRAINT "KPI_pkey" PRIMARY KEY (id);


--
-- Name: LeaveBalance LeaveBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY (id);


--
-- Name: LeavePolicy LeavePolicy_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeavePolicy"
    ADD CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY (id);


--
-- Name: LeaveRequest LeaveRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY (id);


--
-- Name: LeaveTypeConfig LeaveTypeConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveTypeConfig"
    ADD CONSTRAINT "LeaveTypeConfig_pkey" PRIMARY KEY (id);


--
-- Name: OTRequest OTRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OTRequest"
    ADD CONSTRAINT "OTRequest_pkey" PRIMARY KEY (id);


--
-- Name: OnboardingTask OnboardingTask_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OnboardingTask"
    ADD CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY (id);


--
-- Name: PayrollPeriod PayrollPeriod_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayrollPeriod"
    ADD CONSTRAINT "PayrollPeriod_pkey" PRIMARY KEY (id);


--
-- Name: PayslipDetail PayslipDetail_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayslipDetail"
    ADD CONSTRAINT "PayslipDetail_pkey" PRIMARY KEY (id);


--
-- Name: Payslip Payslip_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_pkey" PRIMARY KEY (id);


--
-- Name: PerformanceReview PerformanceReview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: Position Position_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_pkey" PRIMARY KEY (id);


--
-- Name: PreOnboardingProfile PreOnboardingProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreOnboardingProfile"
    ADD CONSTRAINT "PreOnboardingProfile_pkey" PRIMARY KEY (id);


--
-- Name: Relative Relative_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relative"
    ADD CONSTRAINT "Relative_pkey" PRIMARY KEY (id);


--
-- Name: ReviewCycle ReviewCycle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ReviewCycle"
    ADD CONSTRAINT "ReviewCycle_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Shift Shift_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (id);


--
-- Name: TaxBracket TaxBracket_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TaxBracket"
    ADD CONSTRAINT "TaxBracket_pkey" PRIMARY KEY (id);


--
-- Name: Account_employeeId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_employeeId_key" ON public."Account" USING btree ("employeeId");


--
-- Name: Account_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_username_key" ON public."Account" USING btree (username);


--
-- Name: Asset_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Asset_code_key" ON public."Asset" USING btree (code);


--
-- Name: CandidateUser_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CandidateUser_email_key" ON public."CandidateUser" USING btree (email);


--
-- Name: Decision_decisionNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Decision_decisionNumber_key" ON public."Decision" USING btree ("decisionNumber");


--
-- Name: Department_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Department_code_key" ON public."Department" USING btree (code);


--
-- Name: Employee_cccd_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Employee_cccd_key" ON public."Employee" USING btree (cccd);


--
-- Name: Employee_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Employee_code_key" ON public."Employee" USING btree (code);


--
-- Name: Employee_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Employee_email_key" ON public."Employee" USING btree (email);


--
-- Name: JobOffer_candidateId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "JobOffer_candidateId_key" ON public."JobOffer" USING btree ("candidateId");


--
-- Name: LeaveTypeConfig_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LeaveTypeConfig_code_key" ON public."LeaveTypeConfig" USING btree (code);


--
-- Name: PayrollPeriod_monthYear_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PayrollPeriod_monthYear_key" ON public."PayrollPeriod" USING btree ("monthYear");


--
-- Name: Permission_action_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Permission_action_key" ON public."Permission" USING btree (action);


--
-- Name: Position_code_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Position_code_key" ON public."Position" USING btree (code);


--
-- Name: PreOnboardingProfile_candidateId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PreOnboardingProfile_candidateId_key" ON public."PreOnboardingProfile" USING btree ("candidateId");


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: SystemSetting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SystemSetting_key_key" ON public."SystemSetting" USING btree (key);


--
-- Name: Account Account_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Account Account_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AssetAssignment AssetAssignment_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssetAssignment"
    ADD CONSTRAINT "AssetAssignment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssetAssignment AssetAssignment_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AssetAssignment"
    ADD CONSTRAINT "AssetAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceAdjustment AttendanceAdjustment_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AttendanceAdjustment"
    ADD CONSTRAINT "AttendanceAdjustment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CandidateFeedback CandidateFeedback_interviewRoundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CandidateFeedback"
    ADD CONSTRAINT "CandidateFeedback_interviewRoundId_fkey" FOREIGN KEY ("interviewRoundId") REFERENCES public."InterviewRound"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Candidate Candidate_jobPostingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Candidate"
    ADD CONSTRAINT "Candidate_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES public."JobPosting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Certificate Certificate_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Certificate"
    ADD CONSTRAINT "Certificate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contract Contract_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Decision Decision_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Decision"
    ADD CONSTRAINT "Decision_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Decision Decision_newDepartmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Decision"
    ADD CONSTRAINT "Decision_newDepartmentId_fkey" FOREIGN KEY ("newDepartmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Decision Decision_newPositionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Decision"
    ADD CONSTRAINT "Decision_newPositionId_fkey" FOREIGN KEY ("newPositionId") REFERENCES public."Position"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Degree Degree_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Degree"
    ADD CONSTRAINT "Degree_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Department Department_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public."Position"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmploymentHistory EmploymentHistory_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmploymentHistory"
    ADD CONSTRAINT "EmploymentHistory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmploymentHistory EmploymentHistory_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmploymentHistory"
    ADD CONSTRAINT "EmploymentHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmploymentHistory EmploymentHistory_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."EmploymentHistory"
    ADD CONSTRAINT "EmploymentHistory_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public."Position"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: InterviewRound InterviewRound_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InterviewRound"
    ADD CONSTRAINT "InterviewRound_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JobOffer JobOffer_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobOffer"
    ADD CONSTRAINT "JobOffer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JobPosting JobPosting_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobPosting"
    ADD CONSTRAINT "JobPosting_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: JobPosting JobPosting_positionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."JobPosting"
    ADD CONSTRAINT "JobPosting_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES public."Position"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: KPI KPI_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."KPI"
    ADD CONSTRAINT "KPI_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LeaveBalance LeaveBalance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LeaveRequest LeaveRequest_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OTRequest OTRequest_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OTRequest"
    ADD CONSTRAINT "OTRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OnboardingTask OnboardingTask_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OnboardingTask"
    ADD CONSTRAINT "OnboardingTask_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayslipDetail PayslipDetail_payslipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PayslipDetail"
    ADD CONSTRAINT "PayslipDetail_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES public."Payslip"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payslip Payslip_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payslip Payslip_payrollPeriodId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES public."PayrollPeriod"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PerformanceReview PerformanceReview_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PerformanceReview PerformanceReview_reviewCycleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_reviewCycleId_fkey" FOREIGN KEY ("reviewCycleId") REFERENCES public."ReviewCycle"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Position Position_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Position"
    ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PreOnboardingProfile PreOnboardingProfile_candidateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PreOnboardingProfile"
    ADD CONSTRAINT "PreOnboardingProfile_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES public."Candidate"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Relative Relative_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relative"
    ADD CONSTRAINT "Relative_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict bf2Tq9Xe8LWWGkqmmW7h6nEvMQQXog9Q2KbXUxb591OvqTSKsdc3iCz7jMKroVM

