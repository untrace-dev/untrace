import Image from 'next/image';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="container grid min-h-screen place-items-center mx-auto">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex items-center flex-col">
          <Image
            src="/logo.svg"
            alt="Acme Logo"
            width={120}
            height={40}
            priority
            className="h-32 w-auto"
          />
          <div className="text-2xl font-bold">Acme</div>
        </div>
        {children}
      </div>
    </main>
  );
}
