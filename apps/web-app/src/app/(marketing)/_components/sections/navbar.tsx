'use client';

import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@untrace/ui/components/button';
import { GitHubStarsButtonWrapper } from '@untrace/ui/custom/github-stars-button/button-wrapper';
import { ThemeToggle } from '@untrace/ui/custom/theme';
import { cn } from '@untrace/ui/lib/utils';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion, useScroll } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icons } from '~/app/(marketing)/_components/icons';
import { type NavItem, NavMenu } from '~/app/(marketing)/_components/nav-menu';
import { siteConfig } from '~/app/(marketing)/_lib/config';

const INITIAL_WIDTH = '70rem';
const MAX_WIDTH = '900px';

// Animation variants
const overlayVariants = {
  exit: { opacity: 0 },
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

const drawerVariants = {
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
    y: 100,
  },
  hidden: { opacity: 0, y: 100 },
  visible: {
    opacity: 1,
    rotate: 0,
    transition: {
      damping: 15,
      staggerChildren: 0.03,
      stiffness: 200,
      type: 'spring',
    },
    y: 0,
  },
} as const;

const drawerMenuContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

const drawerMenuVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

export function Navbar({ navs }: { navs?: NavItem[] }) {
  const { scrollY } = useScroll();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const sections = siteConfig.nav.links.map((item) =>
        item.href.substring(1),
      );

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      setHasScrolled(latest > 10);
    });
    return unsubscribe;
  }, [scrollY]);

  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const handleOverlayClick = () => setIsDrawerOpen(false);

  return (
    <motion.header
      animate={{ opacity: 1 }}
      className={cn(
        'sticky z-50 mx-4 flex justify-center transition-all duration-300 md:mx-0',
        hasScrolled ? 'top-6' : 'top-4 mx-0',
      )}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{ width: hasScrolled ? MAX_WIDTH : INITIAL_WIDTH }}
        initial={{ width: INITIAL_WIDTH }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div
          className={cn(
            'mx-auto max-w-7xl rounded-2xl transition-all duration-300  xl:px-0',
            hasScrolled
              ? 'px-2 border border-border backdrop-blur-lg bg-background/75'
              : 'shadow-none px-7',
          )}
        >
          <div className="flex h-[56px] items-center justify-between pl-1 md:pl-2 pr-4">
            <Link className="flex items-center gap-1" href="/">
              <Icons.logo className="size-12" />
              <p className="text-lg font-semibold text-primary">Untrace</p>
            </Link>

            <NavMenu navs={navs} />

            <div className="flex flex-row items-center gap-1 md:gap-3 shrink-0">
              <div className="flex items-center space-x-4">
                <Link
                  className="bg-secondary h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12]"
                  href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-create-webhook-url"
                >
                  Create Webhook URL
                </Link>
                <SignedIn>
                  <Button
                    asChild
                    className="hidden md:flex rounded-full"
                    variant="outline"
                  >
                    <Link href="/dashboard?utm_source=marketing-site&utm_medium=navbar-dashboard">
                      Dashboard
                    </Link>
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button
                    asChild
                    className="hidden md:flex rounded-full"
                    variant="outline"
                  >
                    <Link href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-sign-in">
                      Sign In
                    </Link>
                  </Button>
                </SignedOut>
              </div>
              <GitHubStarsButtonWrapper
                className="rounded-full"
                repo="untrace-sh/untrace"
              />
              <ThemeToggle className="rounded-full" mode="toggle" />
              <button
                className="md:hidden border border-border size-8 rounded-md cursor-pointer flex items-center justify-center"
                onClick={toggleDrawer}
                type="button"
              >
                {isDrawerOpen ? (
                  <X className="size-5" />
                ) : (
                  <Menu className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              animate="visible"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              exit="exit"
              initial="hidden"
              onClick={handleOverlayClick}
              transition={{ duration: 0.2 }}
              variants={overlayVariants}
            />

            <motion.div
              animate="visible"
              className="fixed inset-x-0 w-[95%] mx-auto bottom-3 bg-background border border-border p-4 rounded-xl shadow-lg"
              exit="exit"
              initial="hidden"
              variants={drawerVariants}
            >
              {/* Mobile menu content */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Link className="flex items-center gap-3" href="/">
                    <Icons.logo className="size-7 md:size-10" />
                    <p className="text-lg font-semibold text-primary">
                      Untrace
                    </p>
                  </Link>
                  <button
                    className="border border-border rounded-md p-1 cursor-pointer"
                    onClick={toggleDrawer}
                    type="button"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <motion.ul
                  className="flex flex-col text-sm mb-4 border border-border rounded-md"
                  variants={drawerMenuContainerVariants}
                >
                  <AnimatePresence>
                    {siteConfig.nav.links.map((item) => (
                      <motion.li
                        className="p-2.5 border-b border-border last:border-b-0"
                        key={item.id}
                        variants={drawerMenuVariants}
                      >
                        <a
                          className={`underline-offset-4 hover:text-primary/80 transition-colors ${
                            activeSection === item.href.substring(1)
                              ? 'text-primary font-medium'
                              : 'text-primary/60'
                          }`}
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            const element = document.getElementById(
                              item.href.substring(1),
                            );
                            element?.scrollIntoView({ behavior: 'smooth' });
                            setIsDrawerOpen(false);
                          }}
                        >
                          {item.name}
                        </a>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Link
                    className="bg-secondary h-8 flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-primary-foreground dark:text-secondary-foreground w-full px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12] hover:bg-secondary/80 transition-all ease-out active:scale-95"
                    href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-create-webhook-url"
                  >
                    Create Webhook URL
                  </Link>
                  <SignedIn>
                    <Button asChild className="rounded-full" variant="outline">
                      <Link href="/dashboard?utm_source=marketing-site&utm_medium=navbar-dashboard">
                        Dashboard
                      </Link>
                    </Button>
                  </SignedIn>
                  <SignedOut>
                    <Button asChild className="rounded-full" variant="outline">
                      <Link href="/webhooks/create?utm_source=marketing-site&utm_medium=navbar-sign-in">
                        Sign In
                      </Link>
                    </Button>
                  </SignedOut>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
