'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CalendarCheck, Clock3, MapPin, Pencil, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/api-error'
import { courtTypeMeta } from '@/lib/court-type'
import { CourtImage } from '@/components/court-image'
import { formatVND } from '@/lib/format'
import type { Court } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export function OwnerCourtCard({
  court,
  pendingCount = 0,
  onDeleted,
}: {
  court: Court
  pendingCount?: number
  onDeleted?: (id: string) => void
}) {
  const meta = courtTypeMeta(court.type)
  const Icon = meta.icon
  const [deleting, setDeleting] = useState(false)

  const remove = async () => {
    setDeleting(true)
    try {
      await api.deleteCourt(court.id)
      toast.success(`Đã xóa sân ${court.name}`)
      onDeleted?.(court.id)
    } catch (e) {
      toast.error(getErrorMessage(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="flex-row p-0 shadow-none">
      <div className="relative aspect-4/3 w-32 shrink-0 overflow-hidden bg-muted text-white sm:w-44">
        <CourtImage
          court={court}
          alt={court.name}
          sizes="(min-width: 640px) 176px, 128px"
          className="size-full object-cover"
        />
        <div className={`absolute inset-0 ${meta.overlay}`} />
        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/20" />
        <div className="absolute inset-x-2 top-3 flex flex-col items-start gap-1.5 sm:inset-x-3 sm:top-3">
          <Badge className="bg-background/90 text-xs text-foreground hover:bg-background/90">{meta.label}</Badge>
          {pendingCount > 0 && <Badge variant="destructive">{pendingCount} đơn chờ</Badge>}
        </div>
        <div className="absolute bottom-3 left-3 flex size-8 items-center justify-center rounded-lg bg-black/30 backdrop-blur-sm sm:bottom-4 sm:left-4 sm:size-9">
          <Icon className="size-4 sm:size-5" />
        </div>
      </div>

      <CardContent className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{court.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{court.address || 'Chưa cập nhật địa chỉ'}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock3 className="size-3.5" />
              {court.openTime} – {court.closeTime}
            </span>
            <span className="font-semibold text-primary">
              {formatVND(Number(court.pricePerHour))}/giờ
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button size="sm" nativeButton={false} render={<Link href={`/owner/courts/${court.id}`} />}>
            <CalendarCheck /> Quản lý đơn
          </Button>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={`/owner/courts/${court.id}/edit`} />}
          >
            <Pencil /> Sửa
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" />}
              disabled={deleting}
            >
              <Trash2 /> Xóa
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa sân {court.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Chỉ xóa được khi sân không còn đơn đặt sân nào chưa hủy. Các đơn đã hủy sẽ bị xóa
                  kèm. Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Giữ lại</AlertDialogCancel>
                <AlertDialogAction onClick={remove} disabled={deleting}>
                  {deleting ? 'Đang xóa...' : 'Xóa sân'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}
