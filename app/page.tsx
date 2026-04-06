'use client'

import React, { useState, useEffect } from 'react'
import DemandAnalytics from '@/components/demand-analytics'

export default function Home() {
  return (
    <main className="min-h-screen">
      <DemandAnalytics />
    </main>
  )
}
