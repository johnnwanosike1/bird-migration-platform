
"use client";

import { useState } from "react";

import { Anchor, AppShell, Avatar, Burger, Button, Group, Image, Menu, Modal, Text } from '@mantine/core';
import { useDisclosure, useHash } from "@mantine/hooks";
import buttonStyle from '../styles/buttonstyle.module.css'
import SideBarComponent from "./SideBar";
import FileUploadButtonComponent from "./UploadDropzone";
import LogoSVG from "../assets/birdseye-logo.svg"



const AppShellLayout = ({ children, hash, setHash }: { children: React.ReactNode, hash: string, setHash: (m: string) => void }) => {
    const [opened, { toggle }] = useDisclosure();

    const menuTop = [
        { name: "Map", link: "map" },
        { name: "Data", link: "data" },
    ]


    return (
        <>
            <AppShell
                layout="alt"
                header={{ height: 60 }}
                footer={{ height: 0 }}
                navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
                padding="md"
            >
                <AppShell.Header >
                    <Group h="100%" px="md" justify="space-between" align="center">
                        <Group >
                            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

                            <Group gap={10} justify="center">
                                {menuTop.map((m, i) => (
                                    <Anchor href={`#${m.link}`} onClick={(e) => {
                                        setHash(m.link)
                                        e.preventDefault()
                                    }} className={buttonStyle.Button} style={{fontWeight: hash.replace("#", "") == m.link ?  600 : 500}} >{m.name}</Anchor>
                                ))}

                            </Group>


                        </Group>
                        <Group>
                                 <Button component="a" href="http://88.208.224.248:8888/" target="_blank" variant="default" radius={"xl"}>Upload GPS data</Button>

                            <Menu width={200} position="bottom-start" shadow="md">
                                <Menu.Target>
                                    <Avatar src="avatar.png" alt="it's me" />
                                </Menu.Target>

                                <Menu.Dropdown>
                                    <Menu.Item>Settings</Menu.Item>

                                    <Menu.Item>Help</Menu.Item>
                                    <Menu.Item>Log Out</Menu.Item>
                                </Menu.Dropdown>
                            </Menu>

                        </Group>
                    </Group>
                </AppShell.Header>
                <AppShell.Navbar p="md">
                    <Group className="border-b pb-4 border-gray-300" justify="center">
                        {/* <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" /> */}

                        <Image src= {LogoSVG} style={{width:150}}  />

                    </Group>

                    <SideBarComponent />
                </AppShell.Navbar>
                <AppShell.Main>
                    {children}
                </AppShell.Main>

                <AppShell.Footer >Footer</AppShell.Footer>
            </AppShell>




        </>
    )
}

export default AppShellLayout