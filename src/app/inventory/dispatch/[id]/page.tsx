import * as React from "react"
import { useParams } from "react-router-dom"
import { DispatchDetailsView } from "./dispatch-details-view"
import { dispatchApi } from "@/lib/api"
import { mapApiDispatch } from "../types"
import { Loader } from "@/components/ui/loader"

export default function DispatchDetailsPage() {
  const params = useParams()
  const id = params?.id as string
  const [dispatch, setDispatch] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)

    dispatchApi.getById(id)
      .then((apiDispatch) => {
        if (!active) return
        if (apiDispatch) {
          setDispatch(mapApiDispatch(apiDispatch))
        }
        setLoading(false)
      })
      .catch((err) => {
        if (active) {
          console.error("Failed to load dispatch details from API:", err)
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader layout="container" size="lg" text="Loading dispatch details..." />
      </div>
    )
  }

  if (!dispatch) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-2">
        <h2 className="text-xl font-bold">Dispatch Record Not Found</h2>
        <p className="text-muted-foreground">The requested dispatch record could not be loaded.</p>
      </div>
    )
  }

  return <DispatchDetailsView dispatch={dispatch} />
}
