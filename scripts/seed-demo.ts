import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NIGERIAN_STATES, WORKER_PROFESSIONS } from "../config/constants";
import ActivityLog from "../models/ActivityLog";
import BankAccount from "../models/BankAccount";
import Job from "../models/Job";
import JobTimeline from "../models/JobTimeline";
import Notification from "../models/Notification";
import Payment from "../models/Payment";
import { Review } from "../models/Review";
import Session from "../models/Session";
import TrustScore from "../models/TrustScore";
import User from "../models/User";
import WorkerProfile from "../models/Worker";
import WorkerEarnings from "../models/WorkerEarnings";

type SeedUser = {
  name: string;
  email: string;
  phone: string;
  role: "customer" | "worker";
};

type SeedJob = {
  title: string;
  description: string;
  price: number;
  customerIndex: number;
  workerIndex: number;
  state: string;
  city: string;
  targetStatus:
    | "requested"
    | "accepted"
    | "in_progress"
    | "completed"
    | "paid"
    | "cancelled";
};

const APP_ROOT = process.cwd();
loadEnvConfig(APP_ROOT);

const DEMO_PASSWORD = "DemoPass123!";
const DEMO_EMAIL_PREFIX = "demo.";

const customers: SeedUser[] = [
  {
    name: "Ada Okafor",
    email: "demo.customer1@streetcred.dev",
    phone: "+2347010000001",
    role: "customer",
  },
  {
    name: "Bola Yusuf",
    email: "demo.customer2@streetcred.dev",
    phone: "+2347010000002",
    role: "customer",
  },
  {
    name: "Chioma Eze",
    email: "demo.customer3@streetcred.dev",
    phone: "+2347010000003",
    role: "customer",
  },
  {
    name: "David Ibrahim",
    email: "demo.customer4@streetcred.dev",
    phone: "+2347010000004",
    role: "customer",
  },
  {
    name: "Ese Adebayo",
    email: "demo.customer5@streetcred.dev",
    phone: "+2347010000005",
    role: "customer",
  },
];

const workers: SeedUser[] = [
  {
    name: "Femi Ade",
    email: "demo.worker1@streetcred.dev",
    phone: "+2347110000001",
    role: "worker",
  },
  {
    name: "Grace Udo",
    email: "demo.worker2@streetcred.dev",
    phone: "+2347110000002",
    role: "worker",
  },
  {
    name: "Hassan Musa",
    email: "demo.worker3@streetcred.dev",
    phone: "+2347110000003",
    role: "worker",
  },
  {
    name: "Ifeoma Ani",
    email: "demo.worker4@streetcred.dev",
    phone: "+2347110000004",
    role: "worker",
  },
  {
    name: "Jide Bello",
    email: "demo.worker5@streetcred.dev",
    phone: "+2347110000005",
    role: "worker",
  },
  {
    name: "Kemi Nnaji",
    email: "demo.worker6@streetcred.dev",
    phone: "+2347110000006",
    role: "worker",
  },
  {
    name: "Lekan Danjuma",
    email: "demo.worker7@streetcred.dev",
    phone: "+2347110000007",
    role: "worker",
  },
  {
    name: "Mary Edet",
    email: "demo.worker8@streetcred.dev",
    phone: "+2347110000008",
    role: "worker",
  },
];

const jobsBlueprint: SeedJob[] = [
  {
    title: "[DEMO] Emergency kitchen sink fix",
    description: "Leaking sink and blocked drain in kitchen.",
    price: 18000,
    customerIndex: 0,
    workerIndex: 0,
    state: "Lagos",
    city: "Ikeja",
    targetStatus: "paid",
  },
  {
    title: "[DEMO] Light rewiring for living room",
    description: "Old wiring sparks when switch is turned on.",
    price: 22000,
    customerIndex: 1,
    workerIndex: 1,
    state: "FCT",
    city: "Garki",
    targetStatus: "paid",
  },
  {
    title: "[DEMO] AC not cooling properly",
    description: "Split unit servicing and gas top-up required.",
    price: 35000,
    customerIndex: 2,
    workerIndex: 2,
    state: "Rivers",
    city: "Port Harcourt",
    targetStatus: "completed",
  },
  {
    title: "[DEMO] Home wall repainting",
    description: "Two bedrooms and hallway repainting.",
    price: 50000,
    customerIndex: 3,
    workerIndex: 3,
    state: "Oyo",
    city: "Ibadan",
    targetStatus: "in_progress",
  },
  {
    title: "[DEMO] Generator maintenance visit",
    description: "Routine servicing for 5kva generator.",
    price: 16000,
    customerIndex: 4,
    workerIndex: 4,
    state: "Enugu",
    city: "Enugu",
    targetStatus: "accepted",
  },
  {
    title: "[DEMO] Bridal dress adjustment",
    description: "Final fitting and length adjustment.",
    price: 12000,
    customerIndex: 0,
    workerIndex: 5,
    state: "Kaduna",
    city: "Kaduna",
    targetStatus: "requested",
  },
  {
    title: "[DEMO] Office deep cleaning",
    description: "One-time deep clean for 2-floor office.",
    price: 28000,
    customerIndex: 1,
    workerIndex: 6,
    state: "Lagos",
    city: "Yaba",
    targetStatus: "cancelled",
  },
  {
    title: "[DEMO] Phone screen replacement",
    description: "OLED display replacement for damaged phone.",
    price: 45000,
    customerIndex: 2,
    workerIndex: 7,
    state: "Anambra",
    city: "Awka",
    targetStatus: "paid",
  },
  {
    title: "[DEMO] Bathroom tile repair",
    description: "Replace broken tiles and reseal edges.",
    price: 30000,
    customerIndex: 3,
    workerIndex: 0,
    state: "Ogun",
    city: "Abeokuta",
    targetStatus: "completed",
  },
  {
    title: "[DEMO] Outdoor event photography",
    description: "4-hour event coverage with edited gallery.",
    price: 60000,
    customerIndex: 4,
    workerIndex: 1,
    state: "Delta",
    city: "Asaba",
    targetStatus: "in_progress",
  },
  {
    title: "[DEMO] Wooden cabinet repair",
    description: "Kitchen cabinet hinge and door panel repairs.",
    price: 24000,
    customerIndex: 0,
    workerIndex: 2,
    state: "Edo",
    city: "Benin City",
    targetStatus: "accepted",
  },
  {
    title: "[DEMO] Barbing home service booking",
    description: "Weekend home haircut and beard trim.",
    price: 9000,
    customerIndex: 2,
    workerIndex: 3,
    state: "Kwara",
    city: "Ilorin",
    targetStatus: "requested",
  },
];

async function connectMongo() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is missing. Add it to .env.local before seeding.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Seeding is blocked in production. Use development/staging environment.",
    );
  }

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
}

async function resetDemoData() {
  const demoUsers = await User.find({
    email: { $regex: `^${DEMO_EMAIL_PREFIX}` },
  })
    .select("_id")
    .lean();
  const userIds = demoUsers.map((user) => user._id);

  const demoWorkers = await WorkerProfile.find({ userId: { $in: userIds } })
    .select("_id")
    .lean();
  const workerIds = demoWorkers.map((worker) => worker._id);

  const demoJobs = await Job.find({
    $or: [
      { title: { $regex: "^\\[DEMO\\]" } },
      { customerId: { $in: userIds } },
      { workerId: { $in: workerIds } },
    ],
  })
    .select("_id")
    .lean();
  const jobIds = demoJobs.map((job) => job._id);

  await Promise.all([
    Review.deleteMany({ jobId: { $in: jobIds } }),
    Payment.deleteMany({ jobId: { $in: jobIds } }),
    JobTimeline.deleteMany({ jobId: { $in: jobIds } }),
    Job.deleteMany({ _id: { $in: jobIds } }),
    BankAccount.deleteMany({ workerId: { $in: workerIds } }),
    WorkerEarnings.deleteMany({ workerId: { $in: workerIds } }),
    TrustScore.deleteMany({ workerId: { $in: workerIds } }),
    Notification.deleteMany({ userId: { $in: userIds } }),
    ActivityLog.deleteMany({ userId: { $in: userIds } }),
    Session.deleteMany({ userId: { $in: userIds } }),
    WorkerProfile.deleteMany({ userId: { $in: userIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ]);
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const customerDocs = await User.insertMany(
    customers.map((customer) => ({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      role: customer.role,
      passwordHash,
      isVerified: true,
      isOnboarded: true,
    })),
  );

  const workerUserDocs = await User.insertMany(
    workers.map((worker) => ({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      role: worker.role,
      passwordHash,
      isVerified: true,
      isOnboarded: true,
    })),
  );

  return { customerDocs, workerUserDocs };
}

async function seedWorkerProfiles(
  workerUserDocs: Array<{ _id: mongoose.Types.ObjectId; name: string }>,
) {
  const profileDocs = await WorkerProfile.insertMany(
    workerUserDocs.map((worker, index) => ({
      userId: worker._id,
      profession: WORKER_PROFESSIONS[index % WORKER_PROFESSIONS.length],
      skills: ["Customer Service", "Attention to detail"],
      bio: `Demo profile for ${worker.name}.`,
      location: {
        city: [
          "Ikeja",
          "Garki",
          "Port Harcourt",
          "Ibadan",
          "Enugu",
          "Kaduna",
          "Yaba",
          "Awka",
        ][index],
        state: NIGERIAN_STATES[index % NIGERIAN_STATES.length],
        address: `${index + 5} Demo Street`,
      },
      yearsOfExperience: 2 + (index % 7),
      trustScore: 60 + (index % 20),
      totalJobsCompleted: 0,
      averageRating: 0,
      verifiedWorker: true,
      isAvailable: true,
    })),
  );

  await Promise.all([
    TrustScore.insertMany(
      profileDocs.map((profile) => ({
        workerId: profile._id,
        completedJobs: 0,
        verifiedPayments: 0,
        averageRating: 0,
        disputeCount: 0,
        score: 0,
      })),
    ),
    WorkerEarnings.insertMany(
      profileDocs.map((profile) => ({
        workerId: profile._id,
        totalEarnings: 0,
        monthlyEarnings: 0,
        lastPaymentDate: null,
      })),
    ),
    BankAccount.insertMany(
      profileDocs.map((profile, index) => ({
        workerId: profile._id,
        bankName: "Demo Bank",
        accountName: workerUserDocs[index].name,
        accountNumber: `10${String(index + 1).padStart(8, "0")}`,
        bankCode: "058",
        verified: true,
      })),
    ),
  ]);

  return profileDocs;
}

async function createJobWithInitialTimeline(params: {
  title: string;
  description: string;
  workerId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  state: string;
  city: string;
  price: number;
}) {
  const job = await Job.create({
    title: params.title,
    description: params.description,
    workerId: params.workerId,
    customerId: params.customerId,
    location: {
      address: "Demo location",
      city: params.city,
      state: params.state,
    },
    price: params.price,
    currency: "NGN",
    status: "requested",
  });

  await Promise.all([
    JobTimeline.create({
      jobId: job._id,
      status: "requested",
      updatedBy: params.customerId,
      notes: "Demo job request created",
    }),
    Notification.create({
      userId: params.customerId,
      title: "Job request submitted",
      message: `You created ${params.title}`,
      type: "job",
    }),
  ]);

  return job;
}

async function transitionJob(
  jobId: mongoose.Types.ObjectId,
  toStatus: SeedJob["targetStatus"],
  actorId: mongoose.Types.ObjectId,
) {
  const job = await Job.findById(jobId);
  if (!job) {
    throw new Error(`Job not found for transition: ${jobId.toString()}`);
  }

  job.status = toStatus;
  if (toStatus === "completed") {
    job.completedAt = new Date();
  }
  await job.save();

  await JobTimeline.create({
    jobId: job._id,
    status: toStatus,
    updatedBy: actorId,
    notes: `Demo transition to ${toStatus}`,
  });
}

async function applyTargetLifecycle(params: {
  jobId: mongoose.Types.ObjectId;
  targetStatus: SeedJob["targetStatus"];
  workerUserId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
}) {
  const flow: Array<"accepted" | "in_progress" | "completed" | "paid"> = [
    "accepted",
    "in_progress",
    "completed",
    "paid",
  ];

  for (const status of flow) {
    if (
      params.targetStatus === "requested" ||
      (params.targetStatus === "accepted" && status !== "accepted") ||
      (params.targetStatus === "in_progress" &&
        (status === "completed" || status === "paid")) ||
      (params.targetStatus === "completed" && status === "paid")
    ) {
      break;
    }

    const actor = status === "paid" ? params.customerId : params.workerUserId;
    await transitionJob(params.jobId, status, actor);
  }

  if (params.targetStatus === "cancelled") {
    await transitionJob(params.jobId, "accepted", params.workerUserId);
    await transitionJob(params.jobId, "cancelled", params.customerId);
  }
}

async function seedJobsAndLifecycle(
  customerDocs: Array<{ _id: mongoose.Types.ObjectId }>,
  workerUserDocs: Array<{ _id: mongoose.Types.ObjectId }>,
  workerProfiles: Array<{ _id: mongoose.Types.ObjectId }>,
) {
  const createdJobs: mongoose.Types.ObjectId[] = [];

  for (const blueprint of jobsBlueprint) {
    const customer = customerDocs[blueprint.customerIndex];
    const workerProfile = workerProfiles[blueprint.workerIndex];
    const workerUser = workerUserDocs[blueprint.workerIndex];

    const job = await createJobWithInitialTimeline({
      title: blueprint.title,
      description: blueprint.description,
      workerId: workerProfile._id,
      customerId: customer._id,
      state: blueprint.state,
      city: blueprint.city,
      price: blueprint.price,
    });

    await applyTargetLifecycle({
      jobId: job._id,
      targetStatus: blueprint.targetStatus,
      workerUserId: workerUser._id,
      customerId: customer._id,
    });

    createdJobs.push(job._id);
  }

  return createdJobs;
}

async function seedPaymentsAndReviews() {
  const paidJobs = await Job.find({ status: "paid" })
    .sort({ createdAt: 1 })
    .select("_id workerId customerId price title")
    .lean();

  if (!paidJobs.length) return;

  await Payment.insertMany(
    paidJobs.map((job, index) => ({
      jobId: job._id,
      workerId: job.workerId,
      customerId: job.customerId,
      amount: job.price,
      currency: "NGN",
      paymentMethod: "card",
      transactionReference: `DEMO-TXN-${String(index + 1).padStart(4, "0")}`,
      paymentGateway: "interswitch",
      status: "successful",
      paidAt: new Date(),
    })),
  );

  await Review.insertMany(
    paidJobs.map((job, index) => ({
      jobId: job._id,
      workerId: job.workerId,
      customerId: job.customerId,
      rating: 4 + (index % 2),
      comment: `Great demo experience on ${job.title}.`,
    })),
  );
}

async function updateWorkerAggregates(
  workerProfiles: Array<{ _id: mongoose.Types.ObjectId }>,
) {
  for (const profile of workerProfiles) {
    const [successfulPayments, reviews] = await Promise.all([
      Payment.find({ workerId: profile._id, status: "successful" })
        .select("amount paidAt")
        .lean(),
      Review.find({ workerId: profile._id }).select("rating").lean(),
    ]);

    const totalEarnings = successfulPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const totalJobsCompleted = successfulPayments.length;
    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    const score = Math.min(
      100,
      Math.round(totalJobsCompleted * 10 + averageRating * 10),
    );

    await Promise.all([
      WorkerProfile.findByIdAndUpdate(profile._id, {
        totalJobsCompleted,
        averageRating: Number(averageRating.toFixed(1)),
        trustScore: score,
      }),
      WorkerEarnings.findOneAndUpdate(
        { workerId: profile._id },
        {
          totalEarnings,
          monthlyEarnings: totalEarnings,
          lastPaymentDate: successfulPayments.length
            ? successfulPayments[successfulPayments.length - 1].paidAt
            : null,
        },
      ),
      TrustScore.findOneAndUpdate(
        { workerId: profile._id },
        {
          completedJobs: totalJobsCompleted,
          verifiedPayments: totalJobsCompleted,
          averageRating: Number(averageRating.toFixed(1)),
          disputeCount: 0,
          score,
        },
      ),
    ]);
  }
}

async function summarize() {
  const demoUsers = await User.find({
    email: { $regex: `^${DEMO_EMAIL_PREFIX}` },
  })
    .select("_id")
    .lean();
  const userIds = demoUsers.map((user) => user._id);
  const demoWorkers = await WorkerProfile.find({ userId: { $in: userIds } })
    .select("_id")
    .lean();
  const workerIds = demoWorkers.map((worker) => worker._id);
  const demoJobs = await Job.find({ title: { $regex: "^\\[DEMO\\]" } })
    .select("_id")
    .lean();
  const jobIds = demoJobs.map((job) => job._id);

  const [
    userCount,
    workerCount,
    jobCount,
    paymentCount,
    reviewCount,
    timelineCount,
    notificationCount,
  ] = await Promise.all([
    User.countDocuments({ _id: { $in: userIds } }),
    WorkerProfile.countDocuments({ _id: { $in: workerIds } }),
    Job.countDocuments({ _id: { $in: jobIds } }),
    Payment.countDocuments({ jobId: { $in: jobIds } }),
    Review.countDocuments({ jobId: { $in: jobIds } }),
    JobTimeline.countDocuments({ jobId: { $in: jobIds } }),
    Notification.countDocuments({ userId: { $in: userIds } }),
  ]);

  console.log("✅ Demo seed complete");
  console.log(`- Users: ${userCount}`);
  console.log(`- Worker profiles: ${workerCount}`);
  console.log(`- Jobs: ${jobCount}`);
  console.log(`- Payments: ${paymentCount}`);
  console.log(`- Reviews: ${reviewCount}`);
  console.log(`- Job timeline entries: ${timelineCount}`);
  console.log(`- Notifications: ${notificationCount}`);
  console.log(`- Demo password: ${DEMO_PASSWORD}`);
}

async function run() {
  await connectMongo();
  await resetDemoData();

  const { customerDocs, workerUserDocs } = await seedUsers();
  const workerProfiles = await seedWorkerProfiles(workerUserDocs);
  await seedJobsAndLifecycle(customerDocs, workerUserDocs, workerProfiles);
  await seedPaymentsAndReviews();
  await updateWorkerAggregates(workerProfiles);
  await summarize();
}

run()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ Demo seed failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
