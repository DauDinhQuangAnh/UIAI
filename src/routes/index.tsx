import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  FacebookLogo,
  Lightning,
  Robot,
  Sparkle,
  XCircle,
} from "@phosphor-icons/react";
import { useSession } from "@/auth/session-store";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (useSession.getState().accessToken) throw redirect({ to: "/agents" });
  },
  component: LandingPage,
});

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView } as const;
}

function LandingPage() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background text-foreground">
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <Comparison />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </div>
  );
}

/* ─── Nav ────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5 font-display">
          <Sparkle weight="fill" className="size-5 text-brand-500" aria-hidden />
          <span className="text-sm font-semibold tracking-tight">REO – AI</span>
          <span className="hidden text-xs text-text-dim sm:block">reply enterprise operation</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600 hover:shadow-[0_0_20px_rgba(240,101,60,0.35)]"
          >
            Đăng nhập <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-65px)] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      {/* Animated blobs */}
      <div className="animate-blob absolute left-[15%] top-[20%] size-[500px] rounded-full bg-brand-500/[0.12] blur-[110px]" />
      <div
        className="animate-blob-slow absolute bottom-[20%] right-[10%] size-[420px] rounded-full bg-brand-600/[0.10] blur-[130px]"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="animate-blob-slower absolute left-[45%] top-[60%] size-[340px] rounded-full bg-orange-500/[0.07] blur-[90px]"
        style={{ animationDelay: "6s" }}
      />

      {/* Dot grid — dark dots on light, light dots on dark */}
      <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:28px_28px] dark:[background-image:radial-gradient(circle,rgba(255,255,255,0.055)_1px,transparent_1px)]" />

      <div className="relative z-10 flex max-w-4xl flex-col items-center gap-7">
        <span className="animate-fade-in rounded-full border border-brand-500/25 bg-brand-500/[0.08] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-300">
          AI · Facebook Messenger · Tự động hóa
        </span>

        <h1
          className="animate-fade-up font-display text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-[64px]"
          style={{ animationDelay: "0.1s" }}
        >
          Tự động hóa phản hồi —{" "}
          <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-brand-300 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-brand-500">
            không cần thêm nhân sự
          </span>
        </h1>

        <p
          className="animate-fade-up max-w-2xl text-lg leading-relaxed text-text-secondary"
          style={{ animationDelay: "0.2s" }}
        >
          REO giúp doanh nghiệp bạn trả lời hàng nghìn tin nhắn Messenger mỗi ngày. Bot hoạt động
          24/7, đội ngũ bạn chỉ tập trung vào những gì thực sự tạo ra giá trị.
        </p>

        <Link
          to="/login"
          className="animate-fade-up flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-600 hover:shadow-[0_0_36px_rgba(240,101,60,0.4)]"
          style={{ animationDelay: "0.3s" }}
        >
          Bắt đầu ngay <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}

/* ─── Stats ──────────────────────────────────────────────────────── */

const STATS = [
  { value: "24/7", label: "Bot không bao giờ ngủ, không nghỉ lễ" },
  { value: "< 2s", label: "Thời gian phản hồi trung bình" },
  { value: "10×", label: "Năng lực xử lý mà không tăng nhân sự" },
];

function Stats() {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} className="border-y border-border bg-surface px-6 py-12">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        {STATS.map((stat, i) => (
          <div
            key={stat.value}
            className="flex flex-col items-center gap-1 text-center transition-all duration-500"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? "translateY(0)" : "translateY(18px)",
              transitionDelay: `${i * 120}ms`,
            }}
          >
            <span className="font-display text-4xl font-bold text-brand-500">{stat.value}</span>
            <span className="text-sm text-text-secondary">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Features ───────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Clock,
    title: "Không bao giờ bỏ lỡ tin nhắn",
    desc: "Khách nhắn lúc 2 giờ sáng, bot trả lời ngay. Không cần trực ca đêm, không lo thất thoát khách hàng ngoài giờ hành chính.",
  },
  {
    icon: BookOpen,
    title: "Câu trả lời nhất quán 100%",
    desc: "Knowledge base của doanh nghiệp là nguồn duy nhất. Không bao giờ sai thông tin, không còn tình trạng mỗi nhân viên nói một kiểu.",
  },
  {
    icon: FacebookLogo,
    title: "Tích hợp ngay trên Messenger",
    desc: "Khách hàng không cần cài thêm app, không cần đổi thói quen. Gặp họ ngay trên kênh họ đang dùng mỗi ngày.",
  },
];

function Features() {
  const { ref, inView } = useInView(0.1);
  return (
    <section className="px-6 py-24">
      <div ref={ref} className="mx-auto max-w-6xl">
        <div
          className="mb-14 flex flex-col items-center gap-3 text-center transition-all duration-500"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(16px)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Tính năng</p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Mọi thứ đội ngũ bạn cần,
            <br />
            <span className="text-text-secondary">bot lo hết phần còn lại</span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-7 transition-all duration-500 hover:border-brand-200 hover:shadow-md"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(24px)",
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-50">
                <f.icon weight="fill" className="size-5 text-brand-500" aria-hidden />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-display text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Comparison ─────────────────────────────────────────────────── */

const BEFORE = [
  "Khách chờ hàng giờ chưa được trả lời",
  "Tuyển thêm nhân sự mỗi khi lượng tin tăng",
  "Mỗi nhân viên trả lời một kiểu, thiếu nhất quán",
  "Bỏ lỡ toàn bộ tin nhắn ngoài giờ hành chính",
];
const AFTER = [
  "Phản hồi tức thì, dưới 2 giây bất kể giờ nào",
  "Scale không giới hạn, chi phí cố định",
  "Nhất quán 100% — một nguồn tri thức duy nhất",
  "Bot hoạt động 24/7, kể cả ngày lễ và cuối tuần",
];

function Comparison() {
  const { ref, inView } = useInView(0.08);
  return (
    <section className="bg-surface-2 px-6 py-24">
      <div ref={ref} className="mx-auto max-w-5xl">
        <div
          className="mb-14 flex flex-col items-center gap-3 text-center transition-all duration-500"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(16px)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Trước & Sau</p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Đội 3 người làm việc của 30 người
          </h2>
          <p className="max-w-xl text-base text-text-secondary">
            Không phải thay thế con người — mà giải phóng họ khỏi những việc lặp đi lặp lại.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div
            className="flex flex-col gap-4 rounded-2xl border border-danger-border bg-danger-bg p-7 transition-all duration-500"
            style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transitionDelay: "80ms" }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-danger-fg opacity-70">Không có REO</p>
            <ul className="flex flex-col gap-3">
              {BEFORE.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <XCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-danger-base opacity-70" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-7 transition-all duration-500"
            style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)", transitionDelay: "180ms" }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">Với REO</p>
            <ul className="flex flex-col gap-3">
              {AFTER.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-text-primary">
                  <CheckCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ───────────────────────────────────────────────── */

const STEPS = [
  {
    icon: FacebookLogo,
    step: "01",
    title: "Kết nối Facebook Page",
    desc: "Cấu hình App ID và Page của doanh nghiệp trong vài bước đơn giản. Không cần kỹ thuật chuyên sâu.",
  },
  {
    icon: BookOpen,
    step: "02",
    title: "Xây dựng Knowledge Base",
    desc: "Nhập thông tin sản phẩm, quy trình xử lý, câu hỏi thường gặp — bot học và nhớ tất cả, không bao giờ quên.",
  },
  {
    icon: Lightning,
    step: "03",
    title: "Bot tự động làm việc",
    desc: "Khách nhắn tin, bot trả lời tức thì. Đội ngũ bạn chỉ xử lý những trường hợp đặc biệt cần sự phán đoán của con người.",
  },
];

function HowItWorks() {
  const { ref, inView } = useInView(0.08);
  return (
    <section className="px-6 py-24">
      <div ref={ref} className="mx-auto max-w-6xl">
        <div
          className="mb-14 flex flex-col items-center gap-3 text-center transition-all duration-500"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(16px)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-500">Cách hoạt động</p>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Triển khai trong một buổi sáng</h2>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-3">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />

          {STEPS.map((s, i) => (
            <div
              key={s.step}
              className="relative flex flex-col gap-4 transition-all duration-500"
              style={{
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(24px)",
                transitionDelay: `${i * 130}ms`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-brand-200 bg-brand-50">
                  <s.icon weight="fill" className="size-5 text-brand-500" aria-hidden />
                </div>
                <span className="font-display text-4xl font-bold text-foreground/[0.07]">{s.step}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ────────────────────────────────────────────────────────── */

function CtaSection() {
  const { ref, inView } = useInView(0.15);
  return (
    <section className="bg-surface-2 px-6 py-24">
      <div
        ref={ref}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 p-12 text-center transition-all duration-500"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(20px)" }}
      >
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-brand-500/[0.08] blur-[80px]" />
        <div className="relative flex flex-col items-center gap-5">
          <Robot weight="fill" className="size-10 text-brand-500" aria-hidden />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Sẵn sàng để bot làm việc thay bạn?
          </h2>
          <p className="max-w-md text-base text-text-secondary">
            Bắt đầu ngay hôm nay. Không cần card, không cần hợp đồng dài hạn.
          </p>
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-brand-600 hover:shadow-[0_0_36px_rgba(240,101,60,0.4)]"
          >
            Đăng nhập ngay <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-2 font-display">
          <Sparkle weight="fill" className="size-4 text-brand-500" aria-hidden />
          <span className="text-sm font-semibold">REO – AI</span>
        </div>
        <p className="text-xs text-text-dim">© {new Date().getFullYear()} REO – reply enterprise operation</p>
      </div>
    </footer>
  );
}
