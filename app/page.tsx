import Hero from "@/components/hero"
import { TokenExtensionFeatures } from "@/components/token-extension-features"
import { TokenStats } from "@/components/token-stats"
import { CommonLayout } from "@/components/common-layout"

export default function Home() {
  return (
    <CommonLayout>
      <Hero />
      <TokenExtensionFeatures />
      <TokenStats />
    </CommonLayout>
  )
}
