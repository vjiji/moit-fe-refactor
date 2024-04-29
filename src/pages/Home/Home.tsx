import { Circle, Map, MapMarker } from 'react-kakao-maps-sdk'
import { useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { throttle } from 'lodash'
import {
  FilterBox,
  HomeLayout,
  ResetSearchBox,
  ResetSearchButton,
  UserLocationButtonBox,
} from './styles'
import useScreenSize from '@/hooks/useScreenSize'
import { type GetMeeting, type Center } from '@/type/meeting'
import { getLocalStorageItem, setLocalStorageItem } from '@/util/localStorage'
import useUserLocation from '@/hooks/useUserLocation'
import LoadingPage from '@/shared/LoadingPage'
import { notify } from '@/components/Toast'
import { type FiltersKey, type Filters } from '@/type/filter'
import { meetingKeys } from '@/constants/queryKeys'
import { getMeetings } from '@/apis/meeting'
import ErrorPage from '@/shared/ErrorPage'
import HomeMeetingsPanel from '@/components/meeting/HomeMeetingsPanel/HomeMeetingsPanel'
import HomeSelectedMeetingPanel from '@/components/meeting/HomeMeetingsPanel/HomeSelectedMeetingPanel'
import Region from '@/components/filter/Region/Region'
import Career from '@/components/filter/Career/Career'
import TechStack from '@/components/filter/TechStack/TechStack'

const DEFAULT_CENTER = {
  lat: 37.5667,
  lng: 126.9784,
}

export default function Home(): JSX.Element {
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const { screenHeight } = useScreenSize()
  const { setUserLocation, isLoading: isLocateLoading } = useUserLocation()
  const [filters, setFilters] = useState<Filters>({
    techStacks: getLocalStorageItem('techStacks') ?? [],
    careers: getLocalStorageItem('careers') ?? [],
    region: getLocalStorageItem('region') ?? [],
  })

  const setUserFirstLocation = (): Center => {
    const handleUserFirstLocation = (position: GeolocationPosition): void => {
      setCenter({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
      setLocalStorageItem('center', {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    }

    setUserLocation(handleUserFirstLocation)
    setLocalStorageItem('center', DEFAULT_CENTER)
    return DEFAULT_CENTER
  }

  const [center, setCenter] = useState<Center>(
    (getLocalStorageItem('center') as Center) ?? setUserFirstLocation()
  )

  const { data, fetchNextPage, isLoading, isError } = useInfiniteQuery({
    queryKey: meetingKeys.filter({ ...center, ...filters }),
    // queryKey: ['test'],
    queryFn: async ({ pageParam }) => {
      return await getMeetings({ center, filters, pageParam })
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.isLast) return lastPage.nextPage
      return undefined
    },
    initialPageParam: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const meetings = useMemo(() => {
    let list: GetMeeting[] = []
    data?.pages.forEach(({ result }) => (list = [...list, ...result]))
    return list
  }, [data])

  const handleFetchPages = throttle(() => {
    void fetchNextPage()
  }, 3000)

  const resetMaptoUserLocation = (position: GeolocationPosition): void => {
    if (mapRef.current === null) return
    mapRef.current.setCenter(
      new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude)
    )
    mapRef.current.setLevel(7)
  }

  const setCurrentCenter = (): void => {
    const currentCenter = mapRef.current?.getCenter()
    if (currentCenter == null) return

    // 재조회 시 지역 필터 초기화
    const resetRegionFilter = (): void => {
      if (
        Boolean(getLocalStorageItem('region')) &&
        (getLocalStorageItem('region') as number[]).length !== 0
      ) {
        notify({
          type: 'warning',
          text: '재조회 시 지역 필터는 초기화됩니다.',
        })
        setLocalStorageItem('region', [])
        setLocalStorageItem('firstRegion', '')
        setFilters({ ...filters, region: [] })
      }
    }

    resetRegionFilter()

    setCenter({
      lat: currentCenter.getLat(),
      lng: currentCenter.getLng(),
    })
    setLocalStorageItem('center', {
      lat: currentCenter.getLat(),
      lng: currentCenter.getLng(),
    })
  }

  // 필터 선택 완료 시 필터 상태 저장
  const handleSetFilters = (key: FiltersKey, value: number[]): void => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setLocalStorageItem(key, value)
  }

  const [selectedMeeting, setSelectedMeeting] = useState<GetMeeting | null>(
    null
  )

  const handleSelectedMeeting = (id: number): void => {
    const target = meetings.filter(({ meetingId }) => meetingId === Number(id))
    setSelectedMeeting(target[0])

    if (mapRef.current !== null) {
      mapRef.current.setCenter(
        new kakao.maps.LatLng(target[0].locationLat, target[0].locationLng)
      )
    }
  }

  const handleSelectMarker = (e: kakao.maps.Marker): void => {
    const selectedId = e.getTitle()
    handleSelectedMeeting(Number(selectedId))
  }

  const storageMeetingId = sessionStorage.getItem('selectedMeetingId')
  if (storageMeetingId !== null) {
    handleSelectedMeeting(Number(storageMeetingId))
    sessionStorage.removeItem('selectedMeetingId')
  }

  if (isError) return <ErrorPage />
  return (
    <HomeLayout>
      {isLoading && <LoadingPage name="페이지를" isFade />}
      {isLocateLoading && <LoadingPage name="내 위치를" isFade />}
      <FilterBox>
        <div className="scroll-box">
          <Region
            selectedFilters={filters.region}
            handleSelectedFilters={(num) => {
              handleSetFilters('region', num)
            }}
            handleSetCenter={(currentCenter: Center) => {
              setCenter(currentCenter)
              setLocalStorageItem('center', currentCenter)
            }}
          />
          <Career
            selectedFilters={filters.careers}
            handleSelectedFilters={(num) => {
              handleSetFilters('careers', num)
            }}
          />
          <TechStack
            selectedFilters={filters.techStacks}
            handleSelectedFilters={(num) => {
              handleSetFilters('techStacks', num)
            }}
          />
        </div>
      </FilterBox>
      <UserLocationButtonBox>
        <button
          type="button"
          onClick={() => {
            setUserLocation(resetMaptoUserLocation)
          }}
        >
          <div>
            <img src="/assets/location.svg" alt="location" />
          </div>
        </button>
      </UserLocationButtonBox>
      <ResetSearchBox>
        <ResetSearchButton
          type="button"
          onClick={setCurrentCenter}
          $isShow={false}
        >
          <img src="/assets/reset.svg" alt="reset" />
          <p>현 지도에서 검색</p>
        </ResetSearchButton>
      </ResetSearchBox>
      <Map
        ref={mapRef}
        center={{
          lat: center.lat,
          lng: center.lng,
        }}
        style={{
          width: '100%',
          height: screenHeight < 932 ? `${screenHeight - 114}px` : '820px',
        }}
        level={8}
        maxLevel={3}
        minLevel={12}
      >
        {meetings?.map(({ meetingId, locationLat, locationLng }) => (
          <MapMarker
            key={meetingId}
            title={String(meetingId)}
            onClick={handleSelectMarker}
            image={{
              src:
                meetingId === selectedMeeting?.meetingId
                  ? '/assets/markerSelected.svg'
                  : '/assets/marker.svg',
              size: {
                width: meetingId === selectedMeeting?.meetingId ? 48 : 40,
                height: meetingId === selectedMeeting?.meetingId ? 48 : 40,
              },
            }}
            position={{ lat: locationLat, lng: locationLng }}
          />
        ))}
        {!isLoading && (
          <Circle
            center={{ lat: center.lat, lng: center.lng }}
            radius={5000}
            strokeWeight={2} //
            strokeColor="red" // 선의 색깔입니다
            strokeOpacity={0.5} // 선의 불투명도 입니다 1에서 0 사이의 값이며 0에 가까울수록 투명합니다
            strokeStyle="dash" // 선의 두께입니다
            fillColor={meetings.length !== 0 ? 'skyblue' : 'red'} // 채우기 색깔입니다
            fillOpacity={meetings.length !== 0 ? 0.2 : 0.3}
          />
        )}
      </Map>
      {meetings != null && (
        <HomeMeetingsPanel
          meetings={meetings}
          handleScrollEnd={handleFetchPages}
        />
      )}
      {selectedMeeting != null && (
        <HomeSelectedMeetingPanel
          meeting={selectedMeeting}
          handleClosePanel={() => {
            setSelectedMeeting(null)
          }}
        />
      )}
    </HomeLayout>
  )
}
