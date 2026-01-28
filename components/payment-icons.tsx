import Image from "next/image";

export function BkashIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center overflow-hidden rounded-lg`}>
      <Image
        src="/images/bkash-logo.jpg"
        alt="Bkash"
        fill
        className="object-contain"
        sizes="80px"
      />
    </div>
  );
}

export function NagadIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <div className={`relative ${className} flex items-center justify-center overflow-hidden rounded-lg`}>
      <Image
        src="/images/nagad-logo.jpg"
        alt="Nagad"
        fill
        className="object-contain"
        sizes="80px"
      />
    </div>
  );
}

export function BinanceIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 126.61 126.61"
      className={className}
      style={{ display: "block", margin: "0 auto" }}
    >
      <g fill="#F3BA2F">
        <path d="m38.73 53.2 24.59-24.58 24.6 24.6 14.3-14.31L63.32 0l-38.9 38.9zM0 63.31l14.3-14.31 14.31 14.31-14.31 14.3zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.9 38.91-38.91-38.88-.02.01zM97.99 63.31l14.3-14.31 14.32 14.31-14.31 14.3z" />
        <path d="m77.83 63.3-14.51-14.52-10.73 10.73-1.24 1.23-2.54 2.54 14.51 14.53 14.51-14.51z" />
      </g>
    </svg>
  );
}
