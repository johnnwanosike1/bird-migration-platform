import { Anchor, Button, Checkbox, Divider, Group, LoadingOverlay, ScrollArea, Stack, Switch } from "@mantine/core"
import { DatePickerInput } from '@mantine/dates';
import { useEffect, useState } from "react";
import { AiOutlineFilter } from "react-icons/ai";
import { useForm } from '@mantine/form';
import { useMapStateStore } from "../stores/mapstate";
import toast from "react-hot-toast";
import { useDisclosure, useSetState } from "@mantine/hooks";


const SideBarComponent = () => {

    // get categories

    const [loadingCat, setloadingCat] = useState(false)
    const [catData, setCatData] = useState<[{ value: string, label: string }]>()
    const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
    const [switchfilter, setswitchfilter] = useState<string[]>(['track-lines'])


    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            filter_date: '',
        },

    });

    // use state

    const { setDate } = useMapStateStore()
    const [selectedIndividualIdentifiers, setSelectedIndividualIdentifiers] = useState<string[]>([]);
    const [state, setState] = useSetState<{selected: any}>({selected: null});


    const LoadCat = () => {

        setloadingCat(true)
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {


                let data = JSON.parse(this.responseText)
                console.log(data);

                let identityArray = data.map((item: any) => {
                    return {
                        value: item['individual-local-identifier'],
                        label: item['individual-local-identifier'],

                    }
                })

                setCatData(identityArray)
            }
        });

        xhr.onload = () => {
            setloadingCat(false)
        }

        xhr.onerror = () => {
            setloadingCat(false)
        }

        xhr.open("GET", `${import.meta.env.VITE_BACKEND_SERVER}/get-categories`);

        xhr.send();
    }


    useEffect(() => {

        LoadCat()

    }, [])



    return (

        <>

            <div className=" space-y-5 relative">


                <div className="my-2 border border-gray-300 rounded-sm py-3 px-4">

                    <Stack gap={10}>
                        <DatePickerInput
                            type="range"
                            label="Date range"
                            placeholder="Pick dates range"
                            popoverProps={{ shadow: "md" }}
                            key={form.key('filter_date')}
                            value={dateRange}
                            enableKeyboardNavigation
                            onChange={setDateRange}
                        />

                        <Button leftSection={<AiOutlineFilter />} onClick={() => {

                            const toastId = toast.loading('Loading Map history data...');


                            setDate({dateRange, filter: switchfilter, selectedIndividualIdentifiers: state.selected ? [] : selectedIndividualIdentifiers}).finally(() => {
                                toast.success('Loading completed', {
                                    id: toastId,
                                });
                            })

                        }} radius={"xl"} type="submit" variant="default">Filter</Button>

                    </Stack>

                </div>



                <Divider label="Layers" labelPosition="left" />
                <Switch.Group defaultValue={switchfilter} onChange={(value) => {
                    setswitchfilter(value);

                }} >
                    <Stack className="border p-3 rounded-sm border-gray-300">

                        <Switch
                            label="Track lines"
                            color="#1D9E75"
                            labelPosition="left"
                            radius="sm"
                            withThumbIndicator={false}
                            value={"track-lines"}
                            styles={{ body: { width: '100%', justifyContent: 'space-between' } }}
                        />
                        <Switch
                            label="Stop-over points"
                            labelPosition="left"
                            radius="sm"
                            withThumbIndicator={false}
                            value={"stopover-points"}
                            color="#1D9E75"
                            styles={{ body: { width: '100%', justifyContent: 'space-between' } }}
                        />

                    </Stack>
                </Switch.Group>

                <Divider label="Individual local identifier" labelPosition="left" />
                <div className="border p-3 rounded-sm border-gray-300">
                    <Switch

                        color="#1D9E75"
                        withThumbIndicator={false}
                        labelPosition="left"
                        styles={{ body: { width: '100%', justifyContent: 'space-between' } }}
                        label="Disable Identity Filter"
                        onChange={(e) => { setState({selected:  e.target.checked }) }}
                        value={state.selected == false ? "off" : "on"}
                        radius="sm"
                    />
                </div>

                <div className="relative border border-gray-300 rounded-sm pl-3 py-2 pr-1" >
                    <LoadingOverlay visible={loadingCat} zIndex={1000} loaderProps={{ size: 'sm' }} overlayProps={{ radius: "sm", blur: 2 }} />
                    <ScrollArea h={200} scrollbars="y">

                        <Checkbox.Group
                            disabled={state.selected}
                            value={selectedIndividualIdentifiers}
                            onChange={setSelectedIndividualIdentifiers}
                            name="individual-local-identifier" hiddenInputValuesSeparator="|">

                            <Stack w={200}>

                                {catData?.map((item, key) => {
                                    return (
                                        <Checkbox key={key} label={item.label} value={item.label} />
                                    )
                                })}

                            </Stack>
                        </Checkbox.Group>

                    </ScrollArea>

                </div>


            </div>

        </>
    )
}

export default SideBarComponent
