import { produce } from "immer";
import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";

export type Updater<T> = (recipe: (draft: T) => void) => void;

export function useImmerLocalStorage<T>(key: string, defaultValue: T): [T, Updater<T>, () => void]
{
	const [value, setValue, removeValue] = useLocalStorage(key, defaultValue);
	const updateValue = useCallback((recipe: (draft: T) => void) =>
	{
		setValue(t => produce(t, recipe));
	}, [setValue]);
	return [value, updateValue, removeValue];
}

export function useProjection<T, U>(value: T, updateValue: Updater<T>, f: (value: T) => U): [U, Updater<U>]
{
	const projectedValue = useMemo(() => f(value), [value, f]);
	const updateProjectedValue = useCallback((recipe: (draft: U) => void) =>
	{
		updateValue(draft =>
		{
			recipe(f(draft));
		});
	}, [updateValue, f]);
	return [projectedValue, updateProjectedValue];
}
